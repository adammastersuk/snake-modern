import { useMemo, useState } from 'react';
import { Difficulty, ScoreEntry, ThemeMode } from '@/lib/game/types';
import { THEME_SURFACES, THEME_TITLES } from '@/lib/theme';

const difficultyLabel: Record<Difficulty, string> = {
  casual: 'Casual',
  classic: 'Classic',
  hardcore: 'Hardcore'
};

type BoardView = 'global' | 'theme' | 'difficulty';

export function LeaderboardPanel({
  scores,
  theme
}: {
  scores: ScoreEntry[];
  theme: ThemeMode;
}) {
  const surface = THEME_SURFACES[theme];
  const [view, setView] = useState<BoardView>('global');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty>('classic');

  const filtered = useMemo(() => {
    if (view === 'theme') {
      return scores.filter((score) => score.mode === theme);
    }
    if (view === 'difficulty') {
      return scores.filter((score) => score.difficulty === difficultyFilter);
    }
    return scores;
  }, [scores, theme, view, difficultyFilter]);

  return (
    <section className={`space-y-3 rounded-2xl border p-4 ${surface.panel}`}>
      <div>
        <h2 className="font-semibold">Global Leaderboard</h2>
        <p className={`text-xs ${surface.textMuted}`}>Top runs ranked by final score.</p>
      </div>

      <div className="flex gap-2 text-xs">
        <button type="button" onClick={() => setView('global')} className={`rounded-full border px-3 py-1 ${view === 'global' ? surface.buttonPrimary : surface.buttonGhost}`}>Global</button>
        <button type="button" onClick={() => setView('theme')} className={`rounded-full border px-3 py-1 ${view === 'theme' ? surface.buttonPrimary : surface.buttonGhost}`}>By Theme</button>
        <button type="button" onClick={() => setView('difficulty')} className={`rounded-full border px-3 py-1 ${view === 'difficulty' ? surface.buttonPrimary : surface.buttonGhost}`}>By Difficulty</button>
      </div>

      {view === 'difficulty' && (
        <div className="flex gap-2 text-xs">
          {(['casual', 'classic', 'hardcore'] as Difficulty[]).map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              onClick={() => setDifficultyFilter(difficulty)}
              className={`rounded-full border px-3 py-1 ${difficultyFilter === difficulty ? surface.buttonPrimary : surface.buttonGhost}`}
            >
              {difficultyLabel[difficulty]}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-72 space-y-2 overflow-auto text-sm">
        {filtered.map((score, index) => (
          <div key={`${score.created_at}-${index}`} className={`rounded-xl border p-2 ${surface.softPanel}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">#{index + 1} · {score.score.toLocaleString()}</span>
            </div>
            <p className={`mt-1 text-xs ${surface.textMuted}`}>
              {score.name ? `${score.name} · ` : ''}Len {score.length} · {difficultyLabel[score.difficulty]} · {THEME_TITLES[score.mode]} · {score.practiceMode ? 'Practice' : 'Standard'}
            </p>
            <p className={`text-xs ${surface.textMuted}`}>{new Date(score.created_at).toLocaleString()}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className={`text-xs ${surface.textMuted}`}>No scores yet for this view.</p>}
      </div>
    </section>
  );
}
