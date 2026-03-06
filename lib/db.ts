import { neon } from '@neondatabase/serverless';

type Primitive = string | number | boolean | null | undefined;

const getDatabaseUrl = () => {
  const connectionString =
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error('Database connection string is missing. Set POSTGRES_URL or DATABASE_URL.');
  }

  return connectionString;
};

const neonSql = () => neon(getDatabaseUrl());

export const query = async <T>(
  strings: TemplateStringsArray,
  ...values: Primitive[]
): Promise<T[]> => {
  return neonSql()(strings, ...values) as Promise<T[]>;
};
