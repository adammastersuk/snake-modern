import { describe, expect, it } from 'vitest';
import { buildConfigForDifficulty, difficultyPresets } from '@/lib/game/difficulty';
import { decodeReplayParam, encodeReplayParam } from '@/lib/game/replay';
import { SeededRng } from '@/lib/game/rng';
import { buildReplay, createInitialState, createReplaySnapshots, defaultConfig, enqueueDirection, simulateReplay, simulateReplayFromSnapshot, spawnFreeCell, stepGame } from '@/lib/game/simulation';
import { Direction } from '@/lib/game/types';

describe('simulation engine', () => {
  it('moves snake in chosen direction with buffered input', () => {
    const state = createInitialState(123, defaultConfig);
    const queue: Direction[] = [];
    enqueueDirection(queue, state, 'up');
    const rng = new SeededRng(state.seed);
    stepGame(state, defaultConfig, queue, rng);
    expect(state.direction).toBe('up');
    expect(state.snake[0].y).toBeLessThan(state.snake[1].y);
  });

  it('never spawns food inside snake', () => {
    const state = createInitialState(2, defaultConfig);
    const rng = new SeededRng(state.seed);
    const spawned = spawnFreeCell(state, defaultConfig, rng);
    expect(state.snake.some((s) => s.x === spawned.x && s.y === spawned.y)).toBe(false);
  });

  it('is deterministic for same seed and inputs', () => {
    const one = createInitialState(777, defaultConfig);
    const two = createInitialState(777, defaultConfig);
    const q1: Direction[] = ['up', 'left', 'down'];
    const q2: Direction[] = ['up', 'left', 'down'];
    const r1 = new SeededRng(one.seed);
    const r2 = new SeededRng(two.seed);

    for (let i = 0; i < 20; i++) {
      stepGame(one, defaultConfig, q1, r1);
      stepGame(two, defaultConfig, q2, r2);
    }

    expect(one.score).toBe(two.score);
    expect(one.snake).toEqual(two.snake);
    expect(one.seed).toBe(two.seed);
  });

  it('maps difficulty presets and practice overrides', () => {
    expect(buildConfigForDifficulty('classic', false).initialSpeed).toBe(difficultyPresets.classic.initialSpeed);
    const practice = buildConfigForDifficulty('hardcore', true);
    expect(practice.speedIncreaseAmount).toBe(0);
    expect(practice.practiceMode).toBe(true);
  });

  it('replay share compression roundtrip works', () => {
    const replay = buildReplay(123, defaultConfig, [{ step: 1, direction: 'up' }]);
    const encoded = encodeReplayParam(replay);
    expect(decodeReplayParam(encoded)).toEqual(replay);
  });

  it('scrubber deterministic state matches full sim to step', () => {
    const replay = buildReplay(456, defaultConfig, [{ step: 1, direction: 'up' }, { step: 3, direction: 'left' }, { step: 7, direction: 'down' }]);
    const snapshots = createReplaySnapshots(replay, 5);
    const fromSnapshot = simulateReplayFromSnapshot(replay, 20, snapshots, 5);
    const full = simulateReplay(replay, 20);
    expect(fromSnapshot.snake).toEqual(full.snake);
    expect(fromSnapshot.score).toBe(full.score);
  });
});
