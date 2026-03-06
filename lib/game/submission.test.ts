import { describe, expect, it } from 'vitest';
import { createFinalRunSnapshot, resolveSubmittedScore } from '@/lib/game/finalRun';
import { buildGameConfig } from '@/lib/game/difficulty';
import { createInitialState } from '@/lib/game/simulation';

describe('final run score flow', () => {
  it('freezes final run score and length from game-over state', () => {
    const state = createInitialState(123, buildGameConfig('classic', false, false));
    state.score = 190;
    state.snake = [...state.snake, { x: 1, y: 1 }, { x: 2, y: 1 }];

    const finalRun = createFinalRunSnapshot(state, {
      difficulty: 'classic',
      mode: 'modern',
      wrapAround: false,
      practiceMode: false
    });

    state.score = 999;
    state.snake.push({ x: 3, y: 1 });

    expect(finalRun.score).toBe(190);
    expect(finalRun.length).toBe(4);
  });

  it('accepts matching backend score and rejects mismatches', () => {
    const finalRun = {
      score: 190,
      length: 14,
      difficulty: 'classic' as const,
      mode: 'modern' as const,
      wrapAround: false,
      practiceMode: false
    };

    expect(resolveSubmittedScore(finalRun, 190)).toBe(190);
    expect(resolveSubmittedScore(finalRun, undefined)).toBe(190);
    expect(() => resolveSubmittedScore(finalRun, 10)).toThrow(
      'Score mismatch after submission (expected 190, got 10).'
    );
  });
});
