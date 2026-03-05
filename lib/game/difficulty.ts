import { Difficulty, GameConfig } from '@/lib/game/types';

const base: Pick<GameConfig, 'width' | 'height'> = { width: 24, height: 24 };

export const difficultyPresets: Record<Difficulty, Omit<GameConfig, 'practiceMode'>> = {
  casual: {
    ...base,
    wrapAround: true,
    initialSpeed: 6,
    speedIncreaseEveryFood: 4,
    speedIncreaseAmount: 0.35,
    maxSpeed: 11
  },
  classic: {
    ...base,
    wrapAround: false,
    initialSpeed: 8,
    speedIncreaseEveryFood: 3,
    speedIncreaseAmount: 0.55,
    maxSpeed: 16
  },
  hardcore: {
    ...base,
    wrapAround: false,
    initialSpeed: 11,
    speedIncreaseEveryFood: 2,
    speedIncreaseAmount: 0.75,
    maxSpeed: 22
  }
};

export const buildGameConfig = (difficulty: Difficulty, practiceMode: boolean, wrapOverride?: boolean): GameConfig => {
  const preset = difficultyPresets[difficulty];
  return {
    ...preset,
    wrapAround: wrapOverride ?? preset.wrapAround,
    practiceMode,
    initialSpeed: practiceMode ? Math.min(6, preset.initialSpeed) : preset.initialSpeed,
    speedIncreaseAmount: practiceMode ? 0.2 : preset.speedIncreaseAmount,
    speedIncreaseEveryFood: practiceMode ? 6 : preset.speedIncreaseEveryFood,
    maxSpeed: practiceMode ? Math.min(10, preset.maxSpeed) : preset.maxSpeed
  };
};
