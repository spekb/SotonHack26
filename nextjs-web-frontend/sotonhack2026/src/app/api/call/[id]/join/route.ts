import { NextResponse } from "next/server";

const globalAny: any = global;
globalAny.roomParticipants = globalAny.roomParticipants || {};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const { userId } = await req.json();

  if (!globalAny.roomParticipants[id]) {
    globalAny.roomParticipants[id] = [];
  }

  const participants = globalAny.roomParticipants[id];

  if (!participants.includes(userId)) {
    if (participants.length >= 2) {
      return NextResponse.json({ status: "full" });
    }
    participants.push(userId);
  }

  const role = participants[0] === userId ? "first" : "second";
  return NextResponse.json({ status: "joined", role });
}
