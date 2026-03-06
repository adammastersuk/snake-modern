import { ThemeMode } from '@/lib/game/types';
import { THEME_SURFACES } from '@/lib/theme';

interface StartOverlayProps {
  running: boolean;
  alive: boolean;
  onStart: () => void;
  theme: ThemeMode;
}

export function StartOverlay({ running, alive, onStart, theme }: StartOverlayProps) {
  if (running && alive) return null;
  const surface = THEME_SURFACES[theme];
  return (
    <div className={`absolute inset-0 z-10 grid place-items-center rounded-2xl text-center ${surface.overlay}`}>
      <div>
        <p className="text-3xl font-bold">{alive ? 'Ready?' : 'Game Over'}</p>
        <p className={`mt-2 text-sm ${surface.textMuted}`}>Press Space or tap Start</p>
        <button onClick={onStart} className={`mt-4 rounded-lg border px-4 py-2 font-semibold ${surface.buttonPrimary}`}>Start</button>
      </div>
    </div>
  );
}
