'use client';

interface Props {
  score: number;
  best: number;
  speed: number;
  length: number;
  replayMode: boolean;
  difficultyLabel: string;
  practiceMode: boolean;
}

export function HUD({ score, best, speed, length, replayMode, difficultyLabel, practiceMode }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm backdrop-blur-md md:grid-cols-6">
      <Stat label="Score" value={score} />
      <Stat label="Best (This device)" value={best} />
      <Stat label="Speed" value={speed.toFixed(1)} />
      <Stat label="Length" value={length} />
      <Stat label="Run" value={replayMode ? 'Replay' : 'Live'} />
      <Stat label="Rules" value={practiceMode ? `${difficultyLabel} · Practice` : difficultyLabel} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-white/60">{label}</p>
      <p className="text-lg font-semibold leading-tight">{value}</p>
    </div>
  );
}
