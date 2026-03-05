import { describe, expect, it } from 'vitest';
import { buildGameConfig, difficultyPresets } from '@/lib/game/difficulty';

describe('difficulty presets', () => {
  it('includes casual, classic, hardcore', () => {
    expect(Object.keys(difficultyPresets).sort()).toEqual(['casual', 'classic', 'hardcore']);
  });

  it('practice mode lowers speed pressure', () => {
    const classic = buildGameConfig('classic', false);
    const practice = buildGameConfig('classic', true);
    expect(practice.initialSpeed).toBeLessThanOrEqual(classic.initialSpeed);
    expect(practice.maxSpeed).toBeLessThanOrEqual(classic.maxSpeed);
  });
});
