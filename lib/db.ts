import { neon } from '@neondatabase/serverless';

type Primitive = string | number | boolean | null | undefined;

const DATABASE_ENV_KEYS = [
  'POSTGRES_URL',
  'DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING'
] as const;

const resolveDatabaseUrl = () => {
  for (const key of DATABASE_ENV_KEYS) {
    const value = process.env[key];
    if (value) {
      return { key, value };
    }
  }

  return null;
};

const getDatabaseUrl = () => {
  const resolved = resolveDatabaseUrl();

  if (!resolved) {
    throw new Error(
      `Database connection string is missing. Set one of: ${DATABASE_ENV_KEYS.join(', ')}.`
    );
  }

  return resolved.value;
};

export const hasDatabaseConfig = () => Boolean(resolveDatabaseUrl());

export const getDatabaseConfigStatus = () => {
  const resolved = resolveDatabaseUrl();
  if (resolved) return { configured: true as const, source: resolved.key };
  return { configured: false as const, expected: DATABASE_ENV_KEYS };
};

const neonSql = () => neon(getDatabaseUrl());

export const query = async <T>(
  strings: TemplateStringsArray,
  ...values: Primitive[]
): Promise<T[]> => {
  return neonSql()(strings, ...values) as Promise<T[]>;
};
