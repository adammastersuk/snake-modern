'use client';

import { useRef } from 'react';

interface Props {
  replayJson: string;
  onImport: (json: string) => void;
}

export function ReplayModal({ replayJson, onImport }: Props) {
  const importRef = useRef<HTMLTextAreaElement>(null);

  return (
    <section className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
      <h2 className="mb-2 text-lg font-semibold">Replay</h2>
      <p className="mb-2 text-xs text-white/70">Export your deterministic run or import to watch replay mode.</p>
      <textarea readOnly value={replayJson} className="mb-2 h-24 w-full rounded bg-black/30 p-2 text-xs" aria-label="Replay export" />
      <textarea ref={importRef} placeholder="Paste replay JSON" className="h-24 w-full rounded bg-black/30 p-2 text-xs" aria-label="Replay import" />
      <button
        className="mt-2 rounded bg-emerald-500 px-3 py-2"
        onClick={() => onImport(importRef.current?.value ?? '')}
      >
        Watch Replay
      </button>
    </section>
  );
}
