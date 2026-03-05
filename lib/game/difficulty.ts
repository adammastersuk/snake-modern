import { Difficulty, GameConfig } from '@/lib/game/types';

export const difficultyPresets: Record<Difficulty, Pick<GameConfig, 'initialSpeed' | 'speedIncreaseEvery' | 'speedIncreaseAmount' | 'maxSpeed' | 'powerUpChance' | 'wrapAround'>> = {
  casual: {
    initialSpeed: 6,
    speedIncreaseEvery: 4,
    speedIncreaseAmount: 0.4,
    maxSpeed: 11,
    powerUpChance: 0.12,
    wrapAround: true
  },
  classic: {
    initialSpeed: 8,
    speedIncreaseEvery: 3,
    speedIncreaseAmount: 0.6,
    maxSpeed: 18,
    powerUpChance: 0.08,
    wrapAround: false
  },
  hardcore: {
    initialSpeed: 11,
    speedIncreaseEvery: 2,
    speedIncreaseAmount: 0.85,
    maxSpeed: 24,
    powerUpChance: 0.05,
    wrapAround: false
  }
};

export const buildConfigForDifficulty = (difficulty: Difficulty, practiceMode: boolean): Partial<GameConfig> => {
  const preset = difficultyPresets[difficulty];
  if (!practiceMode) return { ...preset, practiceMode: false };

  return {
    ...preset,
    initialSpeed: Math.min(preset.initialSpeed, 6),
    speedIncreaseEvery: 9999,
    speedIncreaseAmount: 0,
    maxSpeed: Math.min(8, preset.maxSpeed),
    practiceMode: true
  };
};
