import { ThemeMode } from '@/lib/game/types';
import { THEME_SURFACES } from '@/lib/theme';

interface HUDProps {
  score: number;
  best: number;
  speed: number;
  length: number;
  foodsToSpeedUp: number | null;
  running: boolean;
  paused: boolean;
  alive: boolean;
  theme: ThemeMode;
}

export function HUD({ score, best, speed, length, foodsToSpeedUp, running, paused, alive, theme }: HUDProps) {
  const surface = THEME_SURFACES[theme];
  const statusLabel = !alive ? 'Game Over' : !running ? 'Ready' : paused ? 'Paused' : 'Running';
  const speedHint = foodsToSpeedUp === null ? 'Max speed' : `${foodsToSpeedUp} to boost`;

  return (
    <div className={`grid flex-1 grid-cols-2 gap-2 rounded-2xl border p-3 text-sm md:grid-cols-5 md:text-base ${surface.panel}`}>
      <Stat label="Score" value={score} theme={theme} />
      <Stat label="Best" value={best} theme={theme} />
      <Stat label="Speed" value={speed.toFixed(2)} theme={theme} />
      <Stat label="Length" value={length} theme={theme} />
      <Stat label="Status" value={statusLabel} hint={speedHint} theme={theme} />
    </div>
  );
}

function Stat({ label, value, hint, theme }: { label: string; value: string | number; hint?: string; theme: ThemeMode }) {
  const surface = THEME_SURFACES[theme];
  return (
    <p className={`rounded-lg border px-2 py-1.5 ${surface.softPanel}`}>
      <span className={surface.textMuted}>{label}:</span> <span className="font-semibold tabular-nums">{value}</span>
      {hint ? <span className={`block text-[0.65rem] leading-snug ${surface.textMuted}`}>{hint}</span> : null}
    </p>
  );
}
