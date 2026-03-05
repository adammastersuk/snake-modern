import { ScoreEntry } from '@/lib/game/types';

export function LeaderboardPanel({ scores, onWatchReplay, onSubmitScore }: { scores: ScoreEntry[]; onWatchReplay: (json: string) => void; onSubmitScore: () => void }) {
  return (
    <section className="space-y-2 rounded-2xl border border-white/15 bg-black/25 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Leaderboard</h2>
        <button onClick={onSubmitScore} className="rounded bg-violet-600 px-3 py-1 text-sm">Submit score</button>
      </div>
      <div className="max-h-56 space-y-2 overflow-auto text-sm">
        {scores.map((score, index) => (
          <div key={`${score.created_at}-${index}`} className="rounded border border-white/10 p-2">
            <div className="flex items-center justify-between"><span>#{index + 1} {score.score}</span><button className="text-cyan-300" onClick={() => onWatchReplay(JSON.stringify(score.replay))}>watch</button></div>
            <p className="text-xs text-white/70">{score.difficulty} · {score.practiceMode ? 'practice' : 'normal'} · {new Date(score.created_at).toLocaleString()}</p>
          </div>
        ))}
        {scores.length === 0 && <p className="text-xs text-white/70">No scores yet.</p>}
      </div>
    </section>
  );
}
