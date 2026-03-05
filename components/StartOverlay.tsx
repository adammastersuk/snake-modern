'use client';

import { Difficulty } from '@/lib/game/types';

export function StartOverlay({ countdown, started, difficulty, onStart }: { countdown: number | null; started: boolean; difficulty: Difficulty; onStart: () => void }) {
  if (started && countdown === null) return null;
  return (
    <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-black/55 text-center">
      <div>
        <p className="text-sm text-white/80">Difficulty: {difficulty}</p>
        {countdown !== null ? <p className="text-7xl font-black">{countdown}</p> : <p className="text-3xl font-bold">Press Space / Tap to Start</p>}
        <p className="mt-2 text-xs text-white/70">Arrows/WASD move · Space pause · R restart</p>
        {!started && <button onClick={onStart} className="mt-3 rounded bg-cyan-500 px-4 py-2">Start</button>}
      </div>
    </div>
  );
}
