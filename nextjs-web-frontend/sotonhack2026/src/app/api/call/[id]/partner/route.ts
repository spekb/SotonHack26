import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/actions/dbActions";

const g = global as typeof global & { callParticipants?: Record<string, string[]> };
if (!g.callParticipants) g.callParticipants = {};
const callParticipants = g.callParticipants;

export async function POST(req: NextRequest, context: { params: Promise<{ callId: string }> }) {
    const { userId } = await req.json();
    const { callId } = await context.params;

    if (!callParticipants[callId]) callParticipants[callId] = [];
    
    // Only keep max 2 participants per call, no duplicates
    if (!callParticipants[callId].includes(userId)) {
        if (callParticipants[callId].length >= 2) {
            // Reset if call already has 2 — fresh call
            callParticipants[callId] = [userId];
        } else {
            callParticipants[callId].push(userId);
        }
    }

    console.log(`Call ${callId} participants:`, callParticipants[callId]);

    const partnerId = callParticipants[callId].find(id => id !== userId);
    if (!partnerId) return NextResponse.json({ partner: null });

    const partner = await getUserById(partnerId);
    if (!partner) return NextResponse.json({ partner: null });
    
    // Strip out any non-serializable fields
    const plainPartner = {
      id: partner.id,
      name: partner.name,
      total_time: partner.total_time,
      conversations: partner.conversations,
      vocab: partner.vocab,
      native_lang: partner.native_lang,
      learning_langs: partner.learning_langs,
      skill_level: partner.skill_level,
      cefr_level: partner.cefr_level ?? "A1",
    };
    
    return NextResponse.json({ partner: plainPartner });
}