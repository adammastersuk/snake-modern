import { afterEach, describe, expect, it, vi } from 'vitest';

const importApiPaths = async () => import('@/lib/api-paths');

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('api path helpers', () => {
  it('prefixes api routes with NEXT_PUBLIC_BASE_PATH', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/snake');
    const { withBasePath, LEADERBOARD_SCORES_API_PATH } = await importApiPaths();

    expect(withBasePath('/api/scores')).toBe('/snake/api/scores');
    expect(LEADERBOARD_SCORES_API_PATH).toBe('/snake/api/scores');
  });

  it('does not double-prefix paths already containing basePath', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/snake');
    const { withBasePath } = await importApiPaths();

    expect(withBasePath('/snake/api/scores')).toBe('/snake/api/scores');
  });
});
