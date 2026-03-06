import { describe, expect, it } from 'vitest';
import { buildGameConfig } from '@/lib/game/difficulty';
import { SeededRng } from '@/lib/game/rng';
import { buildReplay, createInitialState, enqueueDirection, simulateReplay, stepGame } from '@/lib/game/simulation';
import { Direction, ReplayLog } from '@/lib/game/types';
import { validateScore } from '@/lib/leaderboard';

const dirs: Direction[] = ['up', 'down', 'left', 'right'];

const nextDirection = (state: ReturnType<typeof createInitialState>): Direction => {
  const head = state.snake[0];
  if (state.food.x > head.x) return 'right';
  if (state.food.x < head.x) return 'left';
  if (state.food.y > head.y) return 'down';
  if (state.food.y < head.y) return 'up';
  return dirs[state.step % dirs.length];
};

const buildScoringReplay = (): ReplayLog => {
  const config = buildGameConfig('classic', false, false);

  for (let seed = 100; seed < 2000; seed += 1) {
    const state = createInitialState(seed, config);
    const rng = new SeededRng(state.seed);
    const queue: Direction[] = [];
    const events: Array<{ step: number; direction: Direction }> = [];

    while (state.alive && state.step < 220) {
      const dir = nextDirection(state);
      const before = queue.length;
      enqueueDirection(queue, state, dir);
      if (queue.length > before) {
        events.push({ step: state.step, direction: dir });
      }
      stepGame(state, config, queue, rng);

      if (state.score >= 10 && state.alive) {
        enqueueDirection(queue, state, 'up');
        events.push({ step: state.step, direction: 'up' });
      }
    }

    if (state.score > 0 && !state.alive) {
      return buildReplay(seed, config, events, state.step);
    }
  }

  throw new Error('Could not generate a scoring replay');
};

describe('leaderboard replay validation', () => {
  it('rejects replay without final step metadata', () => {
    const replay = buildScoringReplay();
    const { finalStep, ...withoutFinalStep } = replay;

    expect(() =>
      validateScore({
        score: 100,
        length: 10,
        difficulty: 'classic',
        mode: 'modern',
        wrapAround: false,
        practiceMode: false,
        replay: withoutFinalStep
      })
    ).toThrow('Replay is missing final step data');
    expect(finalStep).toBeGreaterThan(0);
  });

  it('derives persisted score and length from replay output', () => {
    const replay = buildScoringReplay();
    const simulated = simulateReplay(replay);

    const validated = validateScore({
      score: 99999,
      length: 999,
      difficulty: 'classic',
      mode: 'retro',
      wrapAround: true,
      practiceMode: true,
      replay
    });

    expect(validated.score).toBe(simulated.score);
    expect(validated.length).toBe(simulated.snake.length);
    expect(validated.wrapAround).toBe(replay.config.wrapAround);
    expect(validated.practiceMode).toBe(replay.config.practiceMode);
  });
});
