import { NextRequest, NextResponse } from 'next/server';
import { getScores, saveScore } from '@/lib/leaderboard';

export async function GET() {
  try {
    const scores = await getScores(50);
    return NextResponse.json({ scores });
  } catch (error) {
    console.error('[scores][GET] Failed to load scores.', error);
    return NextResponse.json(
      { scores: [], error: error instanceof Error ? error.message : 'Failed to load scores' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const saved = await saveScore(payload);
    const scores = await getScores(50);
    const rank = scores.findIndex((entry) =>
      entry.score === saved.score &&
      entry.length === saved.length &&
      entry.difficulty === saved.difficulty &&
      entry.mode === saved.mode
    );

    return NextResponse.json({
      ok: true,
      score: saved.score,
      length: saved.length,
      rank: rank >= 0 ? rank + 1 : null,
      scores
    });
  } catch (error) {
    console.error('[scores][POST] Failed to save score.', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Invalid payload' },
      { status: 400 }
    );
  }
}
