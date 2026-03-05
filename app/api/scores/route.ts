import { NextRequest, NextResponse } from 'next/server';
import { allowRequest, getScores, isGlobalLeaderboardEnabled, saveScore, validateSubmission } from '@/lib/leaderboard';

export async function GET(request: NextRequest) {
  const limit = Math.min(25, Number(request.nextUrl.searchParams.get('limit') ?? '10'));
  const scores = await getScores(limit);
  return NextResponse.json({ enabled: isGlobalLeaderboardEnabled(), scores });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'local';
  if (!allowRequest(ip)) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const submission = validateSubmission(body);
    await saveScore(submission);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
