'use client';

import { Direction } from '@/lib/game/types';

export function MobileControls({ onInput, showDpad }: { onInput: (d: Direction) => void; showDpad: boolean }) {
  if (!showDpad) return null;
  const btn = 'rounded bg-white/20 px-4 py-3 text-lg font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300';
  return (
    <div className="grid w-48 grid-cols-3 gap-2 md:hidden" aria-label="On-screen movement controls">
      <div />
      <button className={btn} onClick={() => onInput('up')} aria-label="Move up">↑</button>
      <div />
      <button className={btn} onClick={() => onInput('left')} aria-label="Move left">←</button>
      <button className={btn} onClick={() => onInput('down')} aria-label="Move down">↓</button>
      <button className={btn} onClick={() => onInput('right')} aria-label="Move right">→</button>
    </div>
  );
}
