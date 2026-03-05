import { sql } from '@vercel/postgres';
import { z } from 'zod';
import { ReplayLog } from '@/lib/game/types';
import { simulateReplay } from '@/lib/game/simulation';

const scoreSchema = z.object({
  name: z.string().trim().max(20).optional(),
  score: z.number().int().nonnegative(),
  mode: z.enum(['modern', 'retro']),
  replay: z.any(),
  difficulty: z.string().optional(),
  wrap: z.boolean().optional(),
  practice: z.boolean().optional(),
  theme: z.enum(['modern', 'retro']).optional(),
  palette: z.string().optional()
});

const canUseDb = !!process.env.POSTGRES_URL;

type ScoreRow = {
  name?: string;
  score: number;
  mode: string;
  created_at: string;
  difficulty?: string;
  wrap?: boolean;
  practice?: boolean;
  theme?: string;
  palette?: string;
  replay?: ReplayLog;
};

const fallbackStore: ScoreRow[] = [];
const requests = new Map<string, number[]>();

export const isGlobalLeaderboardEnabled = () => canUseDb;

export const allowRequest = (key: string, limit = 8, windowMs = 60_000) => {
  const now = Date.now();
  const arr = requests.get(key) ?? [];
  const filtered = arr.filter((t) => now - t < windowMs);
  if (filtered.length >= limit) return false;
  filtered.push(now);
  requests.set(key, filtered);
  return true;
};

export const validateSubmission = (payload: unknown) => {
  const parsed = scoreSchema.parse(payload);
  const replay = parsed.replay as ReplayLog;
  if (!replay) throw new Error('Replay required');
  const state = simulateReplay(replay);
  if (state.score !== parsed.score) throw new Error('Replay score verification failed');
  return parsed;
};

export const saveScore = async (submission: ReturnType<typeof validateSubmission>) => {
  if (!canUseDb) {
    fallbackStore.unshift({
      name: submission.name,
      score: submission.score,
      mode: submission.mode,
      created_at: new Date().toISOString(),
      difficulty: submission.difficulty,
      wrap: submission.wrap,
      practice: submission.practice,
      theme: submission.theme,
      palette: submission.palette,
      replay: submission.replay
    });
    return;
  }
  await sql`INSERT INTO scores (name, score, mode, difficulty, wrap, practice, theme, palette, replay, created_at)
    VALUES (${submission.name ?? null}, ${submission.score}, ${submission.mode}, ${submission.difficulty ?? null}, ${submission.wrap ?? false}, ${submission.practice ?? false}, ${submission.theme ?? submission.mode}, ${submission.palette ?? null}, ${JSON.stringify(submission.replay)}, NOW())`;
};

export const getScores = async (limit: number) => {
  if (!canUseDb) return fallbackStore.slice(0, limit);
  const { rows } = await sql`SELECT name, score, mode, created_at, difficulty, wrap, practice, theme, palette, replay FROM scores ORDER BY score DESC, created_at DESC LIMIT ${limit}`;
  return rows as ScoreRow[];
};
