'use client';

import { useMemo, useState } from 'react';

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return replayLink;
    return `${window.location.origin}${replayLink}`;
  }, [replayLink]);

  const copyShareLink = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    await navigator.clipboard.writeText(shareUrl);
  };

  return (
    <section className="space-y-3 rounded-2xl border border-white/15 bg-black/25 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Replay</h2>
        <button type="button" className="rounded-lg border border-white/20 px-2.5 py-1 text-xs" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? 'Simple view' : 'Advanced'}
        </button>
      </div>

      <p className="text-xs text-slate-300/90">Share your run with one link. Friends can open it directly and watch the replay.</p>

      <div className="grid grid-cols-2 gap-2">
        <a href={replayLink} className="rounded-lg bg-cyan-600 px-3 py-2 text-center text-sm font-medium">Open share link</a>
        <button type="button" className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium" onClick={() => void copyShareLink()}>
          Copy link
        </button>
      </div>

      <label className="block text-xs">Paste replay link or code
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste shared URL, compressed code, or JSON"
          className="mt-1 w-full rounded bg-black/35 p-2 text-xs"
        />
      </label>
      <button className="rounded bg-emerald-500 px-3 py-1.5 text-sm" onClick={() => onImport(value.trim())}>Load replay</button>

      {showAdvanced && (
        <label className="block text-xs">Raw replay JSON (advanced)
          <textarea readOnly value={replayJson} className="mt-1 h-24 w-full rounded bg-black/35 p-2 text-xs" />
        </label>
      )}

      <label className="block text-xs">Timeline: {replayFrame}/{replayFrameMax}
        <input type="range" min={0} max={Math.max(0, replayFrameMax)} value={replayFrame} onChange={(e) => onFrameChange(Number(e.target.value))} className="w-full" />
      </label>
    </section>
  );
}
