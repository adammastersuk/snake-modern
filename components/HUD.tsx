interface HUDProps {
  score: number;
  best: number;
  speed: number;
  length: number;
}

export function HUD({ score, best, speed, length }: HUDProps) {
  return (
    <div className="grid flex-1 grid-cols-2 gap-2 rounded-2xl border border-white/15 bg-black/30 p-3 text-sm md:grid-cols-4 md:text-base">
      <Stat label="Score" value={score} />
      <Stat label="Best" value={best} />
      <Stat label="Speed" value={speed.toFixed(2)} />
      <Stat label="Length" value={length} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <p className="rounded-lg bg-white/5 px-2 py-1.5">
      <span className="text-white/60">{label}:</span> <span className="font-semibold tabular-nums">{value}</span>
    </p>
  );
}
