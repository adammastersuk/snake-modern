'use client';

import { useState } from 'react';

interface Props {
  replayJson: string;
  replayLink: string;
  replayFrame: number;
  replayFrameMax: number;
  onImport: (text: string) => void;
  onFrameChange: (v: number) => void;
}

export function ReplayPanel({ replayJson, replayLink, replayFrame, replayFrameMax, onImport, onFrameChange }: Props) {
  const [value, setValue] = useState('');

  return (
    <section className="space-y-2 rounded-2xl border border-white/15 bg-black/25 p-4">
      <h2 className="font-semibold">Replay</h2>
      <textarea readOnly value={replayJson} className="h-24 w-full rounded bg-black/35 p-2 text-xs" />
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Paste replay JSON or compressed string" className="w-full rounded bg-black/35 p-2 text-xs" />
      <div className="flex gap-2">
        <button className="rounded bg-emerald-500 px-3 py-1" onClick={() => onImport(value)}>Load replay</button>
        <a href={replayLink} className="rounded bg-cyan-600 px-3 py-1">Share link</a>
      </div>
      <label className="block text-xs">Timeline: {replayFrame}/{replayFrameMax}
        <input type="range" min={0} max={Math.max(0, replayFrameMax)} value={replayFrame} onChange={(e) => onFrameChange(Number(e.target.value))} className="w-full" />
      </label>
    </section>
  );
}
