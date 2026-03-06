import { query } from '@/lib/db';
import { simulateReplay } from '@/lib/game/simulation';
import { Difficulty, ReplayLog, ScoreEntry, ThemeMode } from '@/lib/game/types';

const memoryStore: ScoreEntry[] = [];

interface ScoreRow {
  id: number;
  name: string | null;
  score: number;
  length: number;
  difficulty: Difficulty;
  mode: ThemeMode;
  wrapAround: boolean;
  practiceMode: boolean;
  replay: ReplayLog | string;
  created_at: string;
}

interface ScoreColumns {
  wrap: string;
  practice: string;
}

let cachedColumns: ScoreColumns | null = null;


const ensureScoresTable = async () => {
  await query`
    CREATE TABLE IF NOT EXISTS scores (
      id SERIAL PRIMARY KEY,
      name TEXT,
      score INTEGER NOT NULL,
      length INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      mode TEXT NOT NULL,
      wrap_around BOOLEAN NOT NULL,
      practice_mode BOOLEAN NOT NULL,
      replay JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await query`CREATE INDEX IF NOT EXISTS idx_scores_rank ON scores (score DESC, created_at DESC)`;
};

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

const getScoreColumns = async (): Promise<ScoreColumns> => {
  if (cachedColumns) return cachedColumns;

  const columns = await query<{ column_name: string }>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'scores'
  `;

  let names = new Set(columns.map((column) => column.column_name));

  if (names.size === 0) {
    await ensureScoresTable();
    const refreshed = await query<{ column_name: string }>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'scores'
    `;
    names = new Set(refreshed.map((column) => column.column_name));
  }

  if (names.has('wrap_around') && names.has('practice_mode')) {
    cachedColumns = { wrap: 'wrap_around', practice: 'practice_mode' };
    return cachedColumns;
  }

  if (names.has('wraparound') && names.has('practicemode')) {
    cachedColumns = { wrap: 'wraparound', practice: 'practicemode' };
    return cachedColumns;
  }

  if (names.has('wrapAround') && names.has('practiceMode')) {
    cachedColumns = { wrap: '"wrapAround"', practice: '"practiceMode"' };
    return cachedColumns;
  }

  throw new Error('Scores table is missing wrap/practice columns. Expected wrap_around/practice_mode.');
};

const parseReplay = (value: ReplayLog | string): ReplayLog => {
  if (typeof value === 'string') {
    return JSON.parse(value) as ReplayLog;
  }
  return value;
};

const normalizeRow = (row: ScoreRow): ScoreEntry => ({
  id: row.id,
  name: row.name ?? undefined,
  score: row.score,
  length: row.length,
  difficulty: row.difficulty,
  mode: row.mode,
  wrapAround: row.wrapAround,
  practiceMode: row.practiceMode,
  replay: parseReplay(row.replay),
  created_at: row.created_at
});

export const validateScore = (payload: ScoreSubmission): ScoreSubmission => {
  if (!payload?.replay) {
    throw new Error('Replay payload is required');
  }

  if (typeof payload.replay.finalStep !== 'number' || payload.replay.finalStep <= 0) {
    throw new Error('Replay is missing final step data');
  }

  const result = simulateReplay(payload.replay);

  if (result.score <= 0) {
    throw new Error('Replay produced no score');
  }

  if (result.alive) {
    throw new Error('Replay must represent a completed run');
  }

  return {
    ...payload,
    difficulty: payload.difficulty,
    wrapAround: payload.replay.config.wrapAround,
    practiceMode: payload.replay.config.practiceMode,
    score: result.score,
    length: result.snake.length
  };
};

export const getScores = async (limit = 20): Promise<ScoreEntry[]> => {
  try {
    const columns = await getScoreColumns();

    if (columns.wrap === 'wrap_around') {
      const rows = await query<ScoreRow>`
        SELECT id, name, score, length, difficulty, mode,
          wrap_around AS "wrapAround",
          practice_mode AS "practiceMode",
          replay,
          created_at
        FROM scores
        ORDER BY score DESC, created_at DESC
        LIMIT ${limit}
      `;
      return rows.map(normalizeRow);
    }

    if (columns.wrap === 'wraparound') {
      const rows = await query<ScoreRow>`
        SELECT id, name, score, length, difficulty, mode,
          wraparound AS "wrapAround",
          practicemode AS "practiceMode",
          replay,
          created_at
        FROM scores
        ORDER BY score DESC, created_at DESC
        LIMIT ${limit}
      `;
      return rows.map(normalizeRow);
    }

    const rows = await query<ScoreRow>`
      SELECT id, name, score, length, difficulty, mode,
        "wrapAround" AS "wrapAround",
        "practiceMode" AS "practiceMode",
        replay,
        created_at
      FROM scores
      ORDER BY score DESC, created_at DESC
      LIMIT ${limit}
    `;
    return rows.map(normalizeRow);
  } catch {
    return memoryStore.slice(0, limit);
  }
};

export const saveScore = async (entry: ScoreSubmission) => {
  const validated = validateScore(entry);

  try {
    const columns = await getScoreColumns();

    if (columns.wrap === 'wrap_around') {
      await query`
        INSERT INTO scores (name, score, length, difficulty, mode, wrap_around, practice_mode, replay)
        VALUES (${validated.name ?? null}, ${validated.score}, ${validated.length}, ${validated.difficulty}, ${validated.mode}, ${validated.wrapAround}, ${validated.practiceMode}, ${JSON.stringify(validated.replay)})
      `;
      return validated;
    }

    if (columns.wrap === 'wraparound') {
      await query`
        INSERT INTO scores (name, score, length, difficulty, mode, wraparound, practicemode, replay)
        VALUES (${validated.name ?? null}, ${validated.score}, ${validated.length}, ${validated.difficulty}, ${validated.mode}, ${validated.wrapAround}, ${validated.practiceMode}, ${JSON.stringify(validated.replay)})
      `;
      return validated;
    }

    await query`
      INSERT INTO scores (name, score, length, difficulty, mode, "wrapAround", "practiceMode", replay)
      VALUES (${validated.name ?? null}, ${validated.score}, ${validated.length}, ${validated.difficulty}, ${validated.mode}, ${validated.wrapAround}, ${validated.practiceMode}, ${JSON.stringify(validated.replay)})
    `;
    return validated;
  } catch {
    memoryStore.unshift({ ...validated, created_at: new Date().toISOString() });
    return validated;
  }
};
