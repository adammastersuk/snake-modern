import { ThemeMode } from '@/lib/game/types';
import { THEME_SURFACES } from '@/lib/theme';

interface SubmitFeedback {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message: string;
}

interface StartOverlayProps {
  running: boolean;
  alive: boolean;
  score: number;
  submitFeedback: SubmitFeedback;
  onStart: () => void;
  onSubmitScore: () => void;
  theme: ThemeMode;
}

export function StartOverlay({ running, alive, score, submitFeedback, onStart, onSubmitScore, theme }: StartOverlayProps) {
  if (running && alive) return null;
  const surface = THEME_SURFACES[theme];
  return (
    <div className={`absolute inset-0 z-10 grid place-items-center rounded-2xl text-center ${surface.overlay}`}>
      <div className="w-full max-w-[18rem] px-4">
        <p className="text-3xl font-bold">{alive ? 'Ready?' : 'Game Over'}</p>
        {!alive && score > 0 && <p className={`mt-2 text-sm font-medium ${surface.textMuted}`}>Score: {score.toLocaleString()}</p>}
        <p className={`mt-2 text-sm ${surface.textMuted}`}>{alive ? 'Press Space or tap Start' : 'Start a new run or submit this score.'}</p>

        {!alive && score > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={onSubmitScore}
              disabled={submitFeedback.status === 'submitting' || submitFeedback.status === 'success'}
              className={`w-full rounded-lg border px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${surface.buttonPrimary}`}
            >
              {submitFeedback.status === 'submitting' ? 'Submitting…' : submitFeedback.status === 'success' ? 'Score Submitted' : 'Submit Score'}
            </button>
            {submitFeedback.status !== 'idle' && (
              <p className={`mt-2 rounded-lg border px-2 py-1 text-xs ${submitFeedback.status === 'error' ? 'border-red-400/60 text-red-300' : surface.softPanel}`}>
                {submitFeedback.message}
              </p>
            )}
          </div>
        )}

        <button onClick={onStart} className={`mt-4 w-full rounded-lg border px-4 py-2 font-semibold ${surface.buttonGhost}`}>
          {alive ? 'Start' : 'Play Again'}
        </button>
      </div>
    </div>
  );
}
