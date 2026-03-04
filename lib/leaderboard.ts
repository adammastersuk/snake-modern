import { sql } from '@vercel/postgres';
import { z } from 'zod';
import { ReplayLog } from '@/lib/game/types';
import { simulateReplay } from '@/lib/game/simulation';

const scoreSchema = z.object({
  name: z.string().trim().max(20).optional(),
  score: z.number().int().nonnegative(),
  mode: z.enum(['modern', 'retro']),
  replay: z.any()
});

const canUseDb = !!process.env.POSTGRES_URL;

const fallbackStore: { name?: string; score: number; mode: string; created_at: string }[] = [];
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
  const state = simulateReplay(replay);
  if (state.score !== parsed.score) {
    throw new Error('Replay score verification failed');
  }
  return parsed;
};

export const saveScore = async (submission: ReturnType<typeof validateSubmission>) => {
  if (!canUseDb) {
    fallbackStore.unshift({
      name: submission.name,
      score: submission.score,
      mode: submission.mode,
      created_at: new Date().toISOString()
    });
    return;
  }
  await sql`INSERT INTO scores (name, score, mode, created_at) VALUES (${submission.name ?? null}, ${submission.score}, ${submission.mode}, NOW())`;
};

export const getScores = async (limit: number) => {
  if (!canUseDb) {
    return fallbackStore.slice(0, limit);
  }
  const { rows } = await sql`SELECT name, score, mode, created_at FROM scores ORDER BY score DESC, created_at DESC LIMIT ${limit}`;
  return rows;
};
