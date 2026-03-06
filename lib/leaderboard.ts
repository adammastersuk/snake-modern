import { hasDatabaseConfig, query } from '@/lib/db';
import { simulateReplay } from '@/lib/game/simulation';
import { Difficulty, ReplayLog, ScoreEntry, ThemeMode } from '@/lib/game/types';

const memoryStore: ScoreEntry[] = [];
const MAX_NAME_LENGTH = 20;

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

export type ScoreColumnVariant = 'snake_case' | 'collapsed' | 'camelCase' | 'short';

interface ScoreColumns {
  schema: string;
  wrap: string;
  practice: string;
  variant: ScoreColumnVariant;
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

const resolveScoreColumnsFromNames = (names: Set<string>): ScoreColumns | null => {
  if (names.has('wrap_around') && names.has('practice_mode')) {
    return { schema: 'public', wrap: 'wrap_around', practice: 'practice_mode', variant: 'snake_case' };
  }

  if (names.has('wraparound') && names.has('practicemode')) {
    return { schema: 'public', wrap: 'wraparound', practice: 'practicemode', variant: 'collapsed' };
  }

  if (names.has('wrapAround') && names.has('practiceMode')) {
    return { schema: 'public', wrap: '"wrapAround"', practice: '"practiceMode"', variant: 'camelCase' };
  }

  if (names.has('wrap') && names.has('practice')) {
    return { schema: 'public', wrap: 'wrap', practice: 'practice', variant: 'short' };
  }

  return null;
};

const getScoreColumns = async (): Promise<ScoreColumns> => {
  if (cachedColumns) return cachedColumns;

  const columns = await query<{ table_schema: string; column_name: string }>`
    SELECT table_schema, column_name
    FROM information_schema.columns
    WHERE table_name = 'scores'
      AND table_schema NOT IN ('information_schema', 'pg_catalog')
  `;

  let columnRows = columns;

  if (columnRows.length === 0) {
    await ensureScoresTable();
    const refreshed = await query<{ table_schema: string; column_name: string }>`
      SELECT table_schema, column_name
      FROM information_schema.columns
      WHERE table_name = 'scores'
        AND table_schema NOT IN ('information_schema', 'pg_catalog')
    `;
    columnRows = refreshed;
  }

  const schemas = Array.from(new Set(columnRows.map((column) => column.table_schema)));
  const currentSchema = await query<{ schema: string }>`SELECT current_schema() AS schema`;
  const preferredSchema = [currentSchema[0]?.schema, 'public', ...schemas].find((schema) => schema && schemas.includes(schema));

  if (!preferredSchema) {
    throw new Error('Unable to resolve scores table schema.');
  }

  const names = new Set(
    columnRows
      .filter((column) => column.table_schema === preferredSchema)
      .map((column) => column.column_name)
  );

  const resolved = resolveScoreColumnsFromNames(names);
  if (resolved) {
    cachedColumns = { ...resolved, schema: preferredSchema };
    return cachedColumns;
  }

  throw new Error(
    `Scores table is missing wrap/practice columns. Found columns: ${Array.from(names).sort().join(', ')}`
  );
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

const asDifficulty = (value: unknown): Difficulty => {
  if (value === 'casual' || value === 'classic' || value === 'hardcore') return value;
  throw new Error('Invalid difficulty');
};

const asMode = (value: unknown): ThemeMode => {
  if (value === 'modern' || value === 'retro' || value === 'masters' || value === 'threed') return value;
  throw new Error('Invalid mode');
};

const normalizeName = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new Error(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`);
  }
  return trimmed;
};

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
    name: normalizeName(payload.name),
    difficulty: asDifficulty(payload.difficulty),
    mode: asMode(payload.mode),
    wrapAround: payload.replay.config.wrapAround,
    practiceMode: payload.replay.config.practiceMode,
    score: result.score,
    length: result.snake.length
  };
};

const summarizeReplay = (replay: ReplayLog) => ({
  version: replay.version,
  finalStep: replay.finalStep,
  events: replay.events.length,
  seed: replay.seed,
  wrapAround: replay.config.wrapAround,
  practiceMode: replay.config.practiceMode
});

const summarizeScoreForLogs = (entry: ScoreSubmission) => ({
  name: entry.name,
  score: entry.score,
  length: entry.length,
  difficulty: entry.difficulty,
  mode: entry.mode,
  wrapAround: entry.wrapAround,
  practiceMode: entry.practiceMode,
  replay: summarizeReplay(entry.replay)
});

const formatDbError = (error: unknown) => {
  if (!error || typeof error !== 'object') return { message: String(error) };
  const dbError = error as { message?: string; code?: string; detail?: string; hint?: string };
  return {
    message: dbError.message ?? 'Unknown DB error',
    code: dbError.code,
    detail: dbError.detail,
    hint: dbError.hint
  };
};

export const getScores = async (limit = 20): Promise<ScoreEntry[]> => {
  try {
    const columns = await getScoreColumns();

    if (columns.variant === 'snake_case') {
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

    if (columns.variant === 'collapsed') {
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

    if (columns.variant === 'short') {
      const rows = await query<ScoreRow>`
        SELECT id, name, score, length, difficulty, mode,
          wrap AS "wrapAround",
          practice AS "practiceMode",
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
  } catch (error) {
    console.error('[leaderboard] Failed to fetch scores from database.', {
      limit,
      error: formatDbError(error)
    });
    if (hasDatabaseConfig()) {
      const formatted = formatDbError(error);
      throw new Error(`Failed to fetch leaderboard scores from database: ${formatted.message}`);
    }
    return memoryStore.slice(0, limit);
  }
};

export const saveScore = async (entry: ScoreSubmission) => {
  const validated = validateScore(entry);

  try {
    const columns = await getScoreColumns();
    console.info('[leaderboard] Attempting score insert.', {
      targetColumns: {
        schema: columns.schema,
        wrap: columns.wrap,
        practice: columns.practice,
        variant: columns.variant
      },
      payload: summarizeScoreForLogs(validated)
    });

    if (columns.variant === 'snake_case') {
      await query`
        INSERT INTO scores (name, score, length, difficulty, mode, wrap_around, practice_mode, replay)
        VALUES (${validated.name ?? null}, ${validated.score}, ${validated.length}, ${validated.difficulty}, ${validated.mode}, ${validated.wrapAround}, ${validated.practiceMode}, ${JSON.stringify(validated.replay)})
      `;
      return validated;
    }

    if (columns.variant === 'collapsed') {
      await query`
        INSERT INTO scores (name, score, length, difficulty, mode, wraparound, practicemode, replay)
        VALUES (${validated.name ?? null}, ${validated.score}, ${validated.length}, ${validated.difficulty}, ${validated.mode}, ${validated.wrapAround}, ${validated.practiceMode}, ${JSON.stringify(validated.replay)})
      `;
      return validated;
    }

    if (columns.variant === 'short') {
      await query`
        INSERT INTO scores (name, score, length, difficulty, mode, wrap, practice, replay)
        VALUES (${validated.name ?? null}, ${validated.score}, ${validated.length}, ${validated.difficulty}, ${validated.mode}, ${validated.wrapAround}, ${validated.practiceMode}, ${JSON.stringify(validated.replay)})
      `;
      return validated;
    }

    await query`
      INSERT INTO scores (name, score, length, difficulty, mode, "wrapAround", "practiceMode", replay)
      VALUES (${validated.name ?? null}, ${validated.score}, ${validated.length}, ${validated.difficulty}, ${validated.mode}, ${validated.wrapAround}, ${validated.practiceMode}, ${JSON.stringify(validated.replay)})
    `;
    return validated;
  } catch (error) {
    console.error('[leaderboard] Failed to persist score in database.', {
      payload: summarizeScoreForLogs(validated),
      error: formatDbError(error)
    });
    if (hasDatabaseConfig()) {
      const formatted = formatDbError(error);
      throw new Error(`Failed to persist score in database: ${formatted.message}`);
    }
    memoryStore.unshift({ ...validated, created_at: new Date().toISOString() });
    return validated;
  }
};

export const __testables = {
  resolveScoreColumnsFromNames
};
