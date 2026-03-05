interface StartOverlayProps {
  running: boolean;
  alive: boolean;
  onStart: () => void;
}

export function StartOverlay({ running, alive, onStart }: StartOverlayProps) {
  if (running && alive) return null;
  return (
    <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-black/55 text-center">
      <div>
        <p className="text-3xl font-bold">{alive ? 'Ready?' : 'Game Over'}</p>
        <p className="mt-2 text-sm text-white/80">Press Space or tap Start</p>
        <button onClick={onStart} className="mt-4 rounded bg-cyan-500 px-4 py-2 font-semibold">Start</button>
      </div>
    </div>
  );
}
