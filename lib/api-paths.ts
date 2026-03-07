const normalizeBasePath = (value: string | undefined) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') return '';
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const clientBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

export const withBasePath = (path: string) => {
  if (!path.startsWith('/')) {
    throw new Error(`Expected an absolute path starting with "/", received "${path}".`);
  }

  if (!clientBasePath) return path;
  if (path === clientBasePath || path.startsWith(`${clientBasePath}/`)) return path;

  return `${clientBasePath}${path}`;
};

export const LEADERBOARD_SCORES_API_PATH = withBasePath('/api/scores');
