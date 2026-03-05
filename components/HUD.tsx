interface HUDProps {
  score: number;
  best: number;
  speed: number;
  length: number;
}

export function HUD({ score, best, speed, length }: HUDProps) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/15 bg-black/25 p-3 text-sm md:grid-cols-4">
      <Stat label="Score" value={score} />
      <Stat label="Best" value={best} />
      <Stat label="Speed" value={speed.toFixed(2)} />
      <Stat label="Length" value={length} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <p><span className="text-white/60">{label}:</span> <span className="font-semibold">{value}</span></p>;
}
