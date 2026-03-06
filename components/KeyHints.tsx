import { ThemeMode } from '@/lib/game/types';
import { THEME_SURFACES } from '@/lib/theme';

export function KeyHints({ theme }: { theme: ThemeMode }) {
  const surface = THEME_SURFACES[theme];
  return <p className={`rounded-xl border px-3 py-2 text-xs ${surface.keyHint}`}>Arrows/WASD move · Space pause/start · R restart · Swipe on mobile</p>;
}
