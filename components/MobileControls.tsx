import { Direction, ThemeMode } from '@/lib/game/types';
import { THEME_SURFACES } from '@/lib/theme';

interface MobileControlsProps {
  onInput: (dir: Direction) => void;
  onPauseToggle: () => void;
  onRestart: () => void;
  paused: boolean;
  visible: boolean;
  hapticsEnabled: boolean;
  reduceMotion: boolean;
  theme: ThemeMode;
}

export function MobileControls({ onInput, onPauseToggle, onRestart, paused, visible, hapticsEnabled, reduceMotion, theme }: MobileControlsProps) {
  const surface = THEME_SURFACES[theme];
  const vibrate = () => {
    if (!hapticsEnabled || reduceMotion || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    navigator.vibrate(12);
  };

  const fireInput = (dir: Direction) => {
    vibrate();
    onInput(dir);
  };

  const actionButton = 'min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold';

  if (!visible) {
    return (
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onPauseToggle} className={`${actionButton} min-w-24 ${surface.buttonGhost}`}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" onClick={onRestart} className={`${actionButton} min-w-24 ${surface.buttonDanger}`}>
          Restart
        </button>
      </div>
    );
  }

  const padButton = `flex min-h-12 min-w-12 items-center justify-center rounded-2xl border text-2xl font-bold shadow-lg active:translate-y-px ${surface.softPanel}`;

  return (
    <div className="space-y-3" role="group" aria-label="Mobile directional controls">
      <div className="mx-auto grid w-fit grid-cols-3 gap-2">
        <div />
        <button type="button" className={padButton} onClick={() => fireInput('up')} aria-label="Move up">↑</button>
        <div />
        <button type="button" className={padButton} onClick={() => fireInput('left')} aria-label="Move left">←</button>
        <button type="button" className={padButton} onClick={() => fireInput('down')} aria-label="Move down">↓</button>
        <button type="button" className={padButton} onClick={() => fireInput('right')} aria-label="Move right">→</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onPauseToggle} className={`${actionButton} ${surface.buttonPrimary}`}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" onClick={onRestart} className={`${actionButton} ${surface.buttonDanger}`}>
          Restart
        </button>
      </div>
    </div>
  );
}
