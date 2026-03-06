export type Direction = 'up' | 'down' | 'left' | 'right';
export type ThemeMode = 'modern' | 'retro' | 'masters' | 'threed';
export type Difficulty = 'casual' | 'classic' | 'hardcore';

export interface Point {
  x: number;
  y: number;
}

export interface GameConfig {
  width: number;
  height: number;
  wrapAround: boolean;
  practiceMode: boolean;
  initialSpeed: number;
  speedIncreaseEveryFood: number;
  speedIncreaseAmount: number;
  maxSpeed: number;
}

export interface GameState {
  snake: Point[];
  direction: Direction;
  food: Point;
  pendingGrowth: number;
  score: number;
  speed: number;
  foodEaten: number;
  step: number;
  alive: boolean;
  seed: number;
}

export interface ScoreEntry {
  id?: number;
  name?: string;
  score: number;
  length: number;
  difficulty: Difficulty;
  mode: ThemeMode;
  wrapAround: boolean;
  practiceMode: boolean;
  created_at: string;
}
