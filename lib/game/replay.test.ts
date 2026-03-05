import { describe, expect, it } from 'vitest';
import { compressReplay, decompressReplay } from '@/lib/game/replay';
import { buildGameConfig } from '@/lib/game/difficulty';

describe('replay compression', () => {
  it('round-trips replay data', () => {
    const replay = {
      version: 1 as const,
      seed: 42,
      config: buildGameConfig('classic', false),
      events: [{ step: 0, direction: 'up' as const }, { step: 5, direction: 'left' as const }],
      finalStep: 120
    };

    const packed = compressReplay(replay);
    const unpacked = decompressReplay(packed);
    expect(unpacked).toEqual(replay);
  });
});
