export type Direction = 'up' | 'down' | 'left' | 'right';
export type ThemeMode = 'modern' | 'retro';

export type Point = { x: number; y: number };

export type PowerUpType = 'slow' | 'multiplier' | 'ghost';

export interface PowerUp {
  position: Point;
  type: PowerUpType;
  spawnedAtStep: number;
}

export interface ActiveEffect {
  type: PowerUpType;
  untilStep: number;
}

export interface InputEvent {
  step: number;
  direction: Direction;
}

export interface ReplayLog {
  seed: number;
  config: GameConfig;
  events: InputEvent[];
}

export interface GameConfig {
  width: number;
  height: number;
  initialSpeed: number;
  speedIncreaseEvery: number;
  maxSpeed: number;
  wrapAround: boolean;
  powerUpChance: number;
}

export interface GameState {
  snake: Point[];
  direction: Direction;
  pendingGrowth: number;
  food: Point;
  powerUp: PowerUp | null;
  effects: ActiveEffect[];
  score: number;
  alive: boolean;
  step: number;
  speed: number;
  seed: number;
  multiplier: number;
}

export interface DebugStats {
  fps: number;
  simSteps: number;
  seed: number;
  snakeLength: number;
}
