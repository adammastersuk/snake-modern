import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { ReplayLog } from '@/lib/game/types';

export const exportReplay = (replay: ReplayLog): string => JSON.stringify(replay);

export const importReplay = (json: string): ReplayLog => {
  const parsed = JSON.parse(json) as ReplayLog;
  if (!parsed || typeof parsed.seed !== 'number' || !Array.isArray(parsed.events)) {
    throw new Error('Invalid replay file');
  }
  return parsed;
};

export const encodeReplayParam = (replay: ReplayLog): string => compressToEncodedURIComponent(exportReplay(replay));

export const decodeReplayParam = (value: string): ReplayLog => {
  const decoded = decompressFromEncodedURIComponent(value);
  if (!decoded) throw new Error('Invalid replay url payload');
  return importReplay(decoded);
};
