import { NextResponse } from "next/server";

const globalMemoryStore = globalThis as unknown as {
  callRooms: Record<string, string[]>;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: callId } = await params;
  const body = await request.json();
  const { userId } = body;

  if (globalMemoryStore.callRooms?.[callId]) {
    globalMemoryStore.callRooms[callId] = globalMemoryStore.callRooms[callId].filter(
      id => id !== userId
    );
  }

  return NextResponse.json({ ok: true });
}