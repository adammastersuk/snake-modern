import { ScoreEntry, ThemeMode } from '@/lib/game/types';
import { THEME_SURFACES } from '@/lib/theme';

export function LeaderboardPanel({ scores, onWatchReplay, onSubmitScore, theme }: { scores: ScoreEntry[]; onWatchReplay: (json: string) => void; onSubmitScore: () => void; theme: ThemeMode }) {
  const surface = THEME_SURFACES[theme];
  return (
    <section className={`space-y-2 rounded-2xl border p-4 ${surface.panel}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Leaderboard</h2>
        <button onClick={onSubmitScore} className={`rounded-lg border px-3 py-1 text-sm ${surface.buttonPrimary}`}>Submit score</button>
      </div>
      <div className="max-h-56 space-y-2 overflow-auto text-sm">
        {scores.map((score, index) => (
          <div key={`${score.created_at}-${index}`} className={`rounded-xl border p-2 ${surface.softPanel}`}>
            <div className="flex items-center justify-between"><span>#{index + 1} {score.score}</span><button className={surface.textMuted} onClick={() => onWatchReplay(JSON.stringify(score.replay))}>watch</button></div>
            <p className={`text-xs ${surface.textMuted}`}>{score.difficulty} · {score.practiceMode ? 'practice' : 'normal'} · {new Date(score.created_at).toLocaleString()}</p>
          </div>
        ))}
        {scores.length === 0 && <p className={`text-xs ${surface.textMuted}`}>No scores yet.</p>}
      </div>
    </section>
  );
}
