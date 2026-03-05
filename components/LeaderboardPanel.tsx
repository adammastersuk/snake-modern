'use client';

import { useMemo, useState } from 'react';
import { ReplayLog } from '@/lib/game/types';

export interface ScoreEntry {
  name?: string;
  score: number;
  mode: string;
  created_at: string;
  difficulty?: string;
  wrap?: boolean;
  practice?: boolean;
  theme?: string;
  palette?: string;
  replay?: ReplayLog;
}

export function LeaderboardPanel({ localScores, globalScores, globalEnabled, onWatchReplay }: { localScores: ScoreEntry[]; globalScores: ScoreEntry[]; globalEnabled: boolean; onWatchReplay: (replay: ReplayLog) => void }) {
  const [tab, setTab] = useState<'local' | 'global'>('local');
  const list = useMemo(() => (tab === 'local' ? localScores : globalScores), [tab, localScores, globalScores]);

  return (
    <section className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
      <div className="mb-3 flex gap-2">
        <button className={`rounded px-3 py-1 ${tab === 'local' ? 'bg-cyan-500' : 'bg-white/20'}`} onClick={() => setTab('local')}>Local</button>
        <button className={`rounded px-3 py-1 ${tab === 'global' ? 'bg-cyan-500' : 'bg-white/20'}`} onClick={() => setTab('global')}>Global</button>
      </div>
      {tab === 'global' && !globalEnabled && <p className="mb-2 text-xs text-white/70">Global leaderboard disabled (missing POSTGRES_URL).</p>}
      <div className="max-h-56 overflow-auto text-xs">
        {list.length === 0 && <p className="text-white/70">No scores yet.</p>}
        {list.map((entry, idx) => (
          <div key={`${entry.created_at}-${idx}`} className="mb-2 rounded border border-white/10 p-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold">#{idx + 1} · {entry.score}</p>
              {entry.replay && <button className="rounded bg-indigo-500 px-2 py-1" onClick={() => onWatchReplay(entry.replay)}>Watch</button>}
            </div>
            <p className="text-white/70">{new Date(entry.created_at).toLocaleString()}</p>
            <p className="text-white/60">{entry.difficulty ?? 'classic'} · {entry.wrap ? 'wrap' : 'walls'} · {entry.practice ? 'practice' : 'normal'} · {entry.theme ?? 'modern'} {entry.palette ? `· ${entry.palette}` : ''}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
