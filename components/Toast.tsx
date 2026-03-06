import { ThemeMode } from '@/lib/game/types';
import { THEME_SURFACES } from '@/lib/theme';

export function Toast({ message, theme }: { message: string; theme: ThemeMode }) {
  if (!message) return null;
  const surface = THEME_SURFACES[theme];
  return <div className={`fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 rounded-xl border px-4 py-2 text-sm ${surface.panel}`}>{message}</div>;
}
