import { Difficulty, GameState, ThemeMode } from '@/lib/game/types';

export interface FinalRunSnapshot {
  score: number;
  length: number;
  difficulty: Difficulty;
  mode: ThemeMode;
  wrapAround: boolean;
  practiceMode: boolean;
}

export const createFinalRunSnapshot = (
  state: GameState,
  metadata: Omit<FinalRunSnapshot, 'score' | 'length'>
): FinalRunSnapshot => ({
  score: state.score,
  length: state.snake.length,
  ...metadata
});

export const resolveSubmittedScore = (finalRun: FinalRunSnapshot, responseScore: unknown) => {
  if (typeof responseScore === 'number' && responseScore !== finalRun.score) {
    throw new Error(`Score mismatch after submission (expected ${finalRun.score}, got ${responseScore}).`);
  }

  return finalRun.score;
};
