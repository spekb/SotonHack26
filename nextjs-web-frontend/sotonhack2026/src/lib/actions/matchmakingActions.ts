'use server';

import mongoose from 'mongoose';
import { connectDB } from '../mongoose';

// ── WaitingRoom schema ────────────────────────────────────────────────────────
const WaitingRoomSchema = new mongoose.Schema({
  userId:       { type: String, required: true, unique: true },
  userName:     { type: String, required: true },
  learningLang: { type: String, required: true },
  skillLevel:   { type: Number, required: true },
  sessionId:    { type: String, default: null },
  matchedWith:  { type: String, default: null },
  joinedAt:     { type: Date,   default: Date.now },
  pollCount:    { type: Number, default: 0 },
}, { strict: false });

// Auto-remove entries that have been waiting more than 2 minutes
WaitingRoomSchema.index({ joinedAt: 1 }, { expireAfterSeconds: 120 });

const WaitingRoomModel =
  mongoose.models.WaitingRoom ||
  mongoose.model('WaitingRoom', WaitingRoomSchema);

// ── Types ─────────────────────────────────────────────────────────────────────

export type WaitingEntry = {
  userId:       string;
  userName:     string;
  learningLang: string;
  skillLevel:   number;
  sessionId:    string | null;
  matchedWith:  string | null;
  joinedAt:     Date;
  pollCount?:   number;
};

export type MatchResult =
  | { status: 'matched';  sessionId: string; partnerId: string; partnerName: string }
  | { status: 'waiting';  currentTolerance?: number }
  | { status: 'error';    message: string };

const SKILL_TOLERANCE = 15;

// ── joinQueue ─────────────────────────────────────────────────────────────────
export async function joinQueue(
  userId:       string,
  userName:     string,
  learningLang: string,
  skillLevel:   number,
): Promise<{ error: string | null }> {
  await connectDB();
  try {
    await WaitingRoomModel.findOneAndUpdate(
      { userId },
      {
        userId,
        userName,
        learningLang,
        skillLevel,
        sessionId:   null,
        matchedWith: null,
        joinedAt:    new Date(),
        pollCount:   0,
      },
      { upsert: true, returnDocument: 'after' },
    );
    return { error: null };
  } catch (e: any) {
    console.error('joinQueue error:', e);
    return { error: e.message };
  }
}

// ── leaveQueue ────────────────────────────────────────────────────────────────
export async function leaveQueue(userId: string): Promise<void> {
  await connectDB();
  try {
    await WaitingRoomModel.deleteOne({ userId });
  } catch (e) {
    console.error('leaveQueue error:', e);
  }
}

// ── findMatch ─────────────────────────────────────────────────────────────────
export async function findMatch(userId: string): Promise<MatchResult> {
  await connectDB();
  try {
    // 1. Load our own entry and increment pollCount
    const me = await WaitingRoomModel.findOneAndUpdate(
      { userId },
      { $inc: { pollCount: 1 } },
      { returnDocument: 'after' }
    ).lean() as WaitingEntry | null;
    if (!me) return { status: 'waiting' };

    // 2. Already matched on a previous poll — just return the result
    if (me.sessionId && me.matchedWith) {
      return {
        status:      'matched',
        sessionId:   me.sessionId,
        partnerId:   me.matchedWith,
        partnerName: '',
      };
    }

    // 3. Look for a compatible unmatched partner (longest-waiting first)
    const pollCount = Math.max(0, (me.pollCount || 1) - 1);
    const doublings = Math.floor(pollCount / 5);
    const currentTolerance = SKILL_TOLERANCE * Math.pow(2, doublings);

    const partner = await WaitingRoomModel.findOne({
      userId:       { $ne: userId },
      learningLang: me.learningLang,
      skillLevel:   { $gte: me.skillLevel - currentTolerance, $lte: me.skillLevel + currentTolerance },
      sessionId:    null,
    })
      .sort({ joinedAt: 1 })
      .lean() as WaitingEntry | null;

    if (!partner) return { status: 'waiting', currentTolerance };

    // 4. Generate a shared session ID and write it to both entries atomically
    const sessionId = new mongoose.Types.ObjectId().toString();

    const [myUpdate] = await Promise.all([
      WaitingRoomModel.findOneAndUpdate(
        { userId, sessionId: null },
        { sessionId, matchedWith: partner.userId },
        { returnDocument: 'after' },
      ),
      WaitingRoomModel.findOneAndUpdate(
        { userId: partner.userId, sessionId: null },
        { sessionId, matchedWith: userId },
        { returnDocument: 'after' },
      ),
    ]);

    if (!myUpdate) return { status: 'waiting', currentTolerance };

    return {
      status:      'matched',
      sessionId,
      partnerId:   partner.userId,
      partnerName: partner.userName,
    };
  } catch (e: any) {
    console.error('findMatch error:', e);
    return { status: 'error', message: e.message };
  }
}

// ── getQueuePosition ──────────────────────────────────────────────────────────
export async function getQueuePosition(userId: string): Promise<number> {
  await connectDB();
  try {
    const me = await WaitingRoomModel.findOne({ userId }).lean() as WaitingEntry | null;
    if (!me) return 0;

    const ahead = await WaitingRoomModel.countDocuments({
      learningLang: me.learningLang,
      skillLevel:   { $gte: me.skillLevel - SKILL_TOLERANCE, $lte: me.skillLevel + SKILL_TOLERANCE },
      sessionId:    null,
      joinedAt:     { $lt: me.joinedAt },
    });

    return ahead;
  } catch {
    return 0;
  }
}
