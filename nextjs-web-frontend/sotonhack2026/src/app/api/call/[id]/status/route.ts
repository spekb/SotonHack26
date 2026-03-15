import { NextResponse } from "next/server";

const globalMemoryStore = globalThis as unknown as {
  callRooms: Record<string, string[]>;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: callId } = await params;
  const room = globalMemoryStore.callRooms?.[callId] ?? [];
  return NextResponse.json({ participants: room.length });
}