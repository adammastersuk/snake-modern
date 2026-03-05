import { Direction } from '@/lib/game/types';

export function MobileControls({ onInput, visible }: { onInput: (d: Direction) => void; visible: boolean }) {
  if (!visible) return null;
  const btn = 'rounded bg-white/20 px-4 py-3 text-lg font-bold';
  return (
    <div className="grid w-44 grid-cols-3 gap-2 md:hidden">
      <div />
      <button className={btn} onClick={() => onInput('up')}>↑</button>
      <div />
      <button className={btn} onClick={() => onInput('left')}>←</button>
      <button className={btn} onClick={() => onInput('down')}>↓</button>
      <button className={btn} onClick={() => onInput('right')}>→</button>
    </div>
  );
}
