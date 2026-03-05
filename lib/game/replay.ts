import { ReplayLog } from '@/lib/game/types';

const toBase64Url = (text: string) => {
  if (typeof window === 'undefined') return Buffer.from(text, 'utf8').toString('base64url');
  const base64 = btoa(unescape(encodeURIComponent(text)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (payload: string) => {
  if (typeof window === 'undefined') return Buffer.from(payload, 'base64url').toString('utf8');
  const padded = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
  return decodeURIComponent(escape(atob(padded)));
};

export const compressReplay = (replay: ReplayLog) => {
  const packed = { ...replay, events: replay.events.map((e) => [e.step, e.direction] as const) };
  return toBase64Url(JSON.stringify(packed));
};

export const decompressReplay = (payload: string): ReplayLog => {
  const parsed = JSON.parse(fromBase64Url(payload)) as {
    seed: number;
    config: ReplayLog['config'];
    finalStep?: number;
    events: Array<[number, ReplayLog['events'][number]['direction']]>;
  };

  return {
    version: 1,
    seed: parsed.seed,
    config: parsed.config,
    finalStep: parsed.finalStep,
    events: parsed.events.map(([step, direction]) => ({ step, direction }))
  };
};

export const exportReplay = (replay: ReplayLog) => JSON.stringify(replay, null, 2);

export const importReplay = (value: string) => {
  const input = value.trim();
  if (!input) throw new Error('Replay input is empty');
  if (input.startsWith('{')) return JSON.parse(input) as ReplayLog;
  return decompressReplay(input);
};
