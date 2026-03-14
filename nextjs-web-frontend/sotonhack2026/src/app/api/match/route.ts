import { NextRequest, NextResponse } from 'next/server';
import { findMatch } from '@/lib/actions/matchmakingActions';

// GET /api/match?userId=xxx
// Polled every 3 seconds by the waiting page.
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const result = await findMatch(userId);
  return NextResponse.json(result);
}
