export type Direction = 'up' | 'down' | 'left' | 'right';
export type ThemeMode = 'modern' | 'retro';
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

export interface InputEvent {
  step: number;
  direction: Direction;
}

export interface ReplayLog {
  version: 1;
  seed: number;
  config: GameConfig;
  events: InputEvent[];
  finalStep?: number;
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
  replay: ReplayLog;
  created_at: string;
}
