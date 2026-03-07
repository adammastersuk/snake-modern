import { NextRequest, NextResponse } from 'next/server';
import { getScores, saveScore, ScoreSubmission } from '@/lib/leaderboard';
import { getDatabaseConfigStatus } from '@/lib/db';

export const runtime = 'nodejs';

type UnknownRecord = Record<string, unknown>;

const isDev = process.env.NODE_ENV !== 'production';

const summarizePayload = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return payload;
  const body = payload as UnknownRecord;

  return {
    name: body.name,
    score: body.score,
    length: body.length,
    difficulty: body.difficulty,
    mode: body.mode,
    wrapAround: body.wrapAround,
    practiceMode: body.practiceMode
  };
};

const formatError = (error: unknown) => {
  if (!error || typeof error !== 'object') return { message: String(error) };
  const e = error as { message?: string; code?: string; detail?: string; hint?: string };
  return {
    message: e.message ?? 'Unknown error',
    code: e.code,
    detail: e.detail,
    hint: e.hint
  };
};

export async function GET() {
  const dbStatus = getDatabaseConfigStatus();

  if (!dbStatus.configured) {
    console.warn('[scores][GET] Database env vars missing; using in-memory leaderboard fallback.', dbStatus);
  }

  try {
    const scores = await getScores(50);
    return NextResponse.json({ scores });
  } catch (error) {
    const details = formatError(error);
    console.error('[scores][GET] Failed to load scores.', details);
    return NextResponse.json(
      {
        scores: [],
        error: details.message,
        ...(isDev ? { details } : {})
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const dbStatus = getDatabaseConfigStatus();
  let payload: unknown = null;

  if (!dbStatus.configured) {
    console.warn('[scores][POST] Database env vars missing; score writes will use in-memory fallback.', dbStatus);
  }

  try {
    payload = await req.json();
    console.info('[scores][POST] Received score payload.', summarizePayload(payload));

    const saved = await saveScore(payload as ScoreSubmission);

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
    const details = formatError(error);
    console.error('[scores][POST] Failed to save score.', {
      payload: summarizePayload(payload),
      dbStatus,
      error: details
    });

    const status = details.message.includes('persist score in database') ? 500 : 400;

    return NextResponse.json(
      {
        ok: false,
        error: details.message,
        ...(isDev ? { details } : {})
      },
      { status }
    );
  }
}
