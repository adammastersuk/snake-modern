'use client';

import { Direction } from '@/lib/game/types';

export function MobileControls({ onInput }: { onInput: (d: Direction) => void }) {
  const btn = 'rounded bg-white/20 px-4 py-3 text-lg font-bold';
  return (
    <div className="grid w-44 grid-cols-3 gap-2 md:hidden">
      <div />
      <button className={btn} onClick={() => onInput('up')} aria-label="Move up">↑</button>
      <div />
      <button className={btn} onClick={() => onInput('left')} aria-label="Move left">←</button>
      <button className={btn} onClick={() => onInput('down')} aria-label="Move down">↓</button>
      <button className={btn} onClick={() => onInput('right')} aria-label="Move right">→</button>
    </div>
  );
}
