import { sql } from '@vercel/postgres';
import { simulateReplay } from '@/lib/game/simulation';
import { Difficulty, ReplayLog, ScoreEntry, ThemeMode } from '@/lib/game/types';

const memoryStore: ScoreEntry[] = [];

export const hasDatabase = () => Boolean(process.env.POSTGRES_URL);

export interface ScoreSubmission {
  name?: string;
  score: number;
  length: number;
  difficulty: Difficulty;
  mode: ThemeMode;
  wrapAround: boolean;
  practiceMode: boolean;
  replay: ReplayLog;
}

export const validateScore = (payload: ScoreSubmission) => {
  const result = simulateReplay(payload.replay);
  if (result.score !== payload.score) throw new Error('Replay score mismatch');
  return payload;
};

export const getScores = async (limit = 20): Promise<ScoreEntry[]> => {
  if (!hasDatabase()) return memoryStore.slice(0, limit);

  const { rows } = await sql<ScoreEntry>`SELECT id, name, score, length, difficulty, mode, wrapAround, practiceMode, replay, created_at FROM scores ORDER BY score DESC, created_at DESC LIMIT ${limit}`;
  return rows;
};

export const saveScore = async (entry: ScoreSubmission) => {
  const validated = validateScore(entry);
  if (!hasDatabase()) {
    memoryStore.unshift({ ...validated, created_at: new Date().toISOString() });
    return;
  }

  await sql`INSERT INTO scores (name, score, length, difficulty, mode, wrapAround, practiceMode, replay)
  VALUES (${validated.name ?? null}, ${validated.score}, ${validated.length}, ${validated.difficulty}, ${validated.mode}, ${validated.wrapAround}, ${validated.practiceMode}, ${JSON.stringify(validated.replay)})`;
};
