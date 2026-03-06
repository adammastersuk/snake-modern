import { NextRequest, NextResponse } from 'next/server';
import { getScores, saveScore, ScoreSubmission } from '@/lib/leaderboard';

export const runtime = 'nodejs';

type UnknownRecord = Record<string, unknown>;

const isDev = process.env.NODE_ENV !== 'production';

const summarizeReplay = (replay: unknown) => {
  if (!replay || typeof replay !== 'object') return null;
  const replayObj = replay as UnknownRecord;
  const events = Array.isArray(replayObj.events) ? replayObj.events.length : null;
  const config = replayObj.config && typeof replayObj.config === 'object' ? (replayObj.config as UnknownRecord) : null;

  return {
    version: replayObj.version,
    finalStep: replayObj.finalStep,
    events,
    seed: replayObj.seed,
    wrapAround: config?.wrapAround,
    practiceMode: config?.practiceMode
  };
};

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
    practiceMode: body.practiceMode,
    replay: summarizeReplay(body.replay)
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
  let payload: unknown = null;

  try {
    payload = await req.json();
    console.info('[scores][POST] Received score payload.', summarizePayload(payload));

    const saved = await saveScore(payload as ScoreSubmission);

    console.info('[scores][POST] Normalized score payload ready for persistence.', {
      name: saved.name,
      score: saved.score,
      length: saved.length,
      difficulty: saved.difficulty,
      mode: saved.mode,
      wrapAround: saved.wrapAround,
      practiceMode: saved.practiceMode,
      replay: summarizeReplay(saved.replay)
    });

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
      error: details
    });

    return NextResponse.json(
      {
        ok: false,
        error: details.message,
        ...(isDev ? { details } : {})
      },
      { status: 400 }
    );
  }
}
