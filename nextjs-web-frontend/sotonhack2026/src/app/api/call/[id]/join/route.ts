import { NextResponse } from "next/server";

// We use globalThis to ensure the memory store persists across hot reloads in development.
const globalMemoryStore = globalThis as unknown as {
  callRooms: Record<string, string[]>;
};

if (!globalMemoryStore.callRooms) {
  globalMemoryStore.callRooms = {};
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // In Next.js 15+, route params are Promises
) {
  try {
    const { id: callId } = await params;
    
    // Parse the body to get userId
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId in request body" },
        { status: 400 }
      );
    }

    // Initialize the room if it doesn't exist
    if (!globalMemoryStore.callRooms[callId]) {
      globalMemoryStore.callRooms[callId] = [];
    }

    const roomParticipants = globalMemoryStore.callRooms[callId];
    
    // Check if the user is already in the room
    const userIndex = roomParticipants.indexOf(userId);
    
    if (userIndex !== -1) {
      // User is already in the room. Return their role.
      if (userIndex === 0) {
        return NextResponse.json({ role: "first" });
      } else if (userIndex === 1) {
        return NextResponse.json({ role: "second" });
      } else {
        // Technically shouldn't happen based on our logic, but just in case
        return NextResponse.json({ status: "full" });
      }
    }

    // User is NOT in the room yet. Try to add them.
    if (roomParticipants.length === 0) {
      roomParticipants.push(userId);
      return NextResponse.json({ role: "first" });
    } else if (roomParticipants.length === 1) {
      roomParticipants.push(userId);
      return NextResponse.json({ role: "second" });
    } else {
      // Room has 2 or more participants. It is full.
      return NextResponse.json({ status: "full" });
    }
  } catch (error) {
    console.error(`Error in /api/call/[id]/join POST:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
