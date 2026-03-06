import { ThemeMode } from '@/lib/game/types';
import { THEME_SURFACES } from '@/lib/theme';

interface HUDProps {
  score: number;
  best: number;
  speed: number;
  length: number;
  theme: ThemeMode;
}

export function HUD({ score, best, speed, length, theme }: HUDProps) {
  const surface = THEME_SURFACES[theme];
  return (
    <div className={`grid flex-1 grid-cols-2 gap-2 rounded-2xl border p-3 text-sm md:grid-cols-4 md:text-base ${surface.panel}`}>
      <Stat label="Score" value={score} theme={theme} />
      <Stat label="Best" value={best} theme={theme} />
      <Stat label="Speed" value={speed.toFixed(2)} theme={theme} />
      <Stat label="Length" value={length} theme={theme} />
    </div>
  );
}

function Stat({ label, value, theme }: { label: string; value: string | number; theme: ThemeMode }) {
  const surface = THEME_SURFACES[theme];
  return (
    <p className={`rounded-lg border px-2 py-1.5 ${surface.softPanel}`}>
      <span className={surface.textMuted}>{label}:</span> <span className="font-semibold tabular-nums">{value}</span>
    </p>
  );
}
