'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  replayJson: string;
  hasReplay: boolean;
  replayShareUrl: string;
  replayMode: boolean;
  replayStep: number;
  maxReplayStep: number;
  onImport: (json: string) => void;
  onCopyJson: () => void;
  onCopyShareLink: () => void;
  onReplayScrub: (step: number) => void;
}

export function ReplayModal(props: Props) {
  const importRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab' && modalRef.current) {
        const nodes = modalRef.current.querySelectorAll<HTMLElement>('button,textarea');
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    modalRef.current?.querySelector<HTMLElement>('textarea,button')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <section className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
      <h2 className="mb-2 text-lg font-semibold">Replay & Share</h2>
      {!props.hasReplay && <p className="mb-3 text-xs text-white/70">Finish a run to export. You can still import and watch a replay below.</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        <button className="rounded bg-emerald-500 px-3 py-2 disabled:opacity-50" disabled={!props.hasReplay} title={!props.hasReplay ? 'Finish a run first' : ''} onClick={props.onCopyJson}>Copy replay JSON</button>
        <button className="rounded bg-cyan-500 px-3 py-2 disabled:opacity-50" disabled={!props.hasReplay} onClick={props.onCopyShareLink}>Copy share link</button>
        <button className="rounded bg-indigo-500 px-3 py-2 sm:col-span-2" onClick={() => setOpen(true)}>Import / Watch Replay</button>
      </div>

      {props.replayMode && (
        <div className="mt-3 text-xs">
          <label className="mb-1 block">Replay timeline: step {props.replayStep}</label>
          <input type="range" min={0} max={Math.max(1, props.maxReplayStep)} value={Math.min(props.replayStep, props.maxReplayStep)} onChange={(e) => props.onReplayScrub(Number(e.target.value))} className="w-full" aria-label="Replay timeline scrubber" />
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Import replay dialog">
          <div ref={modalRef} className="w-full max-w-xl rounded-xl border border-white/20 bg-slate-900 p-4">
            <h3 className="mb-2 font-semibold">Import Replay JSON</h3>
            <textarea ref={importRef} placeholder="Paste replay JSON" className="h-36 w-full rounded bg-black/30 p-2 text-xs" aria-label="Replay import" />
            <div className="mt-2 flex gap-2">
              <button className="rounded bg-emerald-500 px-3 py-2" onClick={() => { props.onImport(importRef.current?.value ?? ''); setOpen(false); }}>Watch replay</button>
              <button className="rounded bg-white/20 px-3 py-2" onClick={() => setOpen(false)}>Close</button>
            </div>
            {props.replayShareUrl && <p className="mt-2 break-all text-xs text-white/70">Share URL preview: {props.replayShareUrl}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
