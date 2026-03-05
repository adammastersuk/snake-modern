import { NextRequest, NextResponse } from 'next/server';
import { getScores, saveScore } from '@/lib/leaderboard';

export async function GET() {
  const scores = await getScores(20);
  return NextResponse.json({ scores });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    await saveScore(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Invalid payload' }, { status: 400 });
  }
}
