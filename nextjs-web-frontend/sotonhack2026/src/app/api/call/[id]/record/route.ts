import { NextResponse } from 'next/server';
import { startRecording, stopRecording } from '@/lib/recorder';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: callId } = await params;
    const body = await request.json();
    const { action, streamId } = body;

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
