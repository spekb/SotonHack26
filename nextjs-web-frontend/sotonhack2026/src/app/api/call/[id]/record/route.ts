import { NextResponse } from 'next/server';
import { startRecording, stopRecording } from '@/lib/recorder';
import { finaliseConversation } from '@/lib/actions/conversationActions';
import * as fs from 'fs';
import * as path from 'path';

// Store for pending recordings to combine them
const globalStore = (globalThis as unknown as { 
  recordings: Record<string, {
    [streamId: string]: { filename: string, participant: { name: string, id: string } }
  }> 
});

if (!globalStore.recordings) {
  globalStore.recordings = {};
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: callId } = await params;
    const body = await request.json();
    const { action, streamId, realUserId, realUserName } = body;

    if (!streamId) {
      return NextResponse.json(
        { error: "Missing streamId in request body" },
        { status: 400 }
      );
    }

    if (action === 'start') {
      const started = await startRecording(streamId);
      if (started) {
        return NextResponse.json({ success: true, message: "Recording started" });
      } else {
        return NextResponse.json({ success: false, error: "Failed to start recording" }, { status: 500 });
      }
    } else if (action === 'stop') {
      const filename = await stopRecording(streamId);
      if (filename) {
        // Track the completed recording
        if (!globalStore.recordings[callId]) {
          globalStore.recordings[callId] = {};
        }
        
        if (realUserId && realUserName) {
          globalStore.recordings[callId][streamId] = {
            filename,
            participant: { name: realUserName, id: realUserId }
          };
        }

        const roomRecordings = Object.values(globalStore.recordings[callId]);
        
        // If we have both recordings, we can run finaliseConversation
        if (roomRecordings.length === 2 && roomRecordings.every(r => r.filename)) {
          const [rec1, rec2] = roomRecordings;
          
          const repDir = path.join(process.cwd(), 'recordings');
          const path1 = path.join(repDir, rec1.filename);
          const path2 = path.join(repDir, rec2.filename);
          
          // Read files to Blobs
          const buffer1 = fs.readFileSync(path1);
          const buffer2 = fs.readFileSync(path2);
          
          const blob1 = new Blob([buffer1], { type: 'audio/webm' });
          const blob2 = new Blob([buffer2], { type: 'audio/webm' });

          const participants = [rec1.participant, rec2.participant];

          // Run finaliseConversation in the background without awaiting it here
          // so we don't block the stop recording response
          finaliseConversation(blob1, blob2, participants).then(() => {
            console.log(`[Recorder] Finalised conversation for call ${callId}`);
          }).catch(err => {
            console.error(`[Recorder] Error finalising conversation for call ${callId}:`, err);
          }).finally(() => {
            try {
              if (fs.existsSync(path1)) fs.unlinkSync(path1);
              if (fs.existsSync(path2)) fs.unlinkSync(path2);
              console.log(`[Recorder] Cleaned up recording files for call ${callId}`);
            } catch (cleanupErr) {
              console.error(`[Recorder] Error cleaning up files for call ${callId}:`, cleanupErr);
            }
          });
          
          // Clean up memory
          delete globalStore.recordings[callId];
        }

        return NextResponse.json({ success: true, filename, message: "Recording stopped and saved" });
      } else {
        return NextResponse.json({ success: false, error: "Failed to stop recording or save file" }, { status: 500 });
      }
    } else {
      return NextResponse.json(
        { error: "Invalid action. Must be 'start' or 'stop'." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`Error in /api/call/[id]/record POST:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
