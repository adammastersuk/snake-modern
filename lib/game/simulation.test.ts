import { describe, expect, it } from 'vitest';
import { buildGameConfig } from '@/lib/game/difficulty';
import { SeededRng } from '@/lib/game/rng';
import { createInitialState, enqueueDirection, stepGame } from '@/lib/game/simulation';
import { Direction } from '@/lib/game/types';

describe('simulation determinism', () => {
  it('produces same result for same seed + inputs', () => {
    const config = buildGameConfig('classic', false);
    const a = createInitialState(1234, config);
    const b = createInitialState(1234, config);
    const qa: Direction[] = [];
    const qb: Direction[] = [];
    const ra = new SeededRng(a.seed);
    const rb = new SeededRng(b.seed);

    const inputs: Direction[] = ['up', 'left', 'down', 'right', 'up'];
    for (let i = 0; i < 60; i += 1) {
      if (i % 10 === 0) {
        enqueueDirection(qa, a, inputs[(i / 10) % inputs.length]);
        enqueueDirection(qb, b, inputs[(i / 10) % inputs.length]);
      }
      stepGame(a, config, qa, ra);
      stepGame(b, config, qb, rb);
    }

    expect(a.score).toBe(b.score);
    expect(a.snake).toEqual(b.snake);
    expect(a.seed).toBe(b.seed);
  });
});
