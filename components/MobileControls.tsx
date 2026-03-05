import { Direction } from '@/lib/game/types';

export function MobileControls({
  onInput,
  visible
}: {
  onInput: (d: Direction) => void;
  visible: boolean;
}) {
  if (!visible) return null;

  const btn =
    'flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/20 text-xl font-bold active:scale-95 active:bg-white/30';

  return (
    <div className="mx-auto grid w-fit grid-cols-3 gap-3">
      <div />
      <button className={btn} onClick={() => onInput('up')}>↑</button>
      <div />

      <button className={btn} onClick={() => onInput('left')}>←</button>
      <button className={btn} onClick={() => onInput('down')}>↓</button>
      <button className={btn} onClick={() => onInput('right')}>→</button>
    </div>
  );
}