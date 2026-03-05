import { SeededRng } from '@/lib/game/rng';
import { Direction, GameConfig, GameState, Point, ReplayLog } from '@/lib/game/types';

const vectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const opposite = (a: Direction, b: Direction) =>
  (a === 'up' && b === 'down') || (a === 'down' && b === 'up') || (a === 'left' && b === 'right') || (a === 'right' && b === 'left');

export const createInitialState = (seed: number, config: GameConfig): GameState => {
  const cx = Math.floor(config.width / 2);
  const cy = Math.floor(config.height / 2);
  const rng = new SeededRng(seed);
  const state: GameState = {
    snake: [{ x: cx, y: cy }, { x: cx - 1, y: cy }],
    direction: 'right',
    food: { x: 0, y: 0 },
    pendingGrowth: 0,
    score: 0,
    speed: config.initialSpeed,
    foodEaten: 0,
    step: 0,
    alive: true,
    seed
  };
  state.food = spawnFreeCell(state, config, rng);
  state.seed = rng.getSeed();
  return state;
};

export const enqueueDirection = (queue: Direction[], state: GameState, next: Direction) => {
  const current = queue.at(-1) ?? state.direction;
  if (current === next || opposite(current, next)) return;
  queue.push(next);
  if (queue.length > 3) queue.shift();
};

const eq = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

export const spawnFreeCell = (state: GameState, config: GameConfig, rng: SeededRng): Point => {
  const occupied = new Set(state.snake.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];
  for (let y = 0; y < config.height; y += 1) {
    for (let x = 0; x < config.width; x += 1) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  return free[rng.int(free.length)] ?? { x: 0, y: 0 };
};

export const stepGame = (state: GameState, config: GameConfig, queue: Direction[], rng: SeededRng) => {
  if (!state.alive) return;
  const nextDir = queue.shift();
  if (nextDir) state.direction = nextDir;

  state.step += 1;
  const d = vectors[state.direction];
  let next = { x: state.snake[0].x + d.x, y: state.snake[0].y + d.y };

  if (config.wrapAround) {
    next = { x: (next.x + config.width) % config.width, y: (next.y + config.height) % config.height };
  } else if (next.x < 0 || next.x >= config.width || next.y < 0 || next.y >= config.height) {
    state.alive = false;
    return;
  }

  const body = state.pendingGrowth > 0 ? state.snake : state.snake.slice(0, -1);
  if (!config.practiceMode && body.some((b) => eq(b, next))) {
    state.alive = false;
    return;
  }

  state.snake.unshift(next);

  if (eq(next, state.food)) {
    state.pendingGrowth += 1;
    state.foodEaten += 1;
    state.score += 10;
    if (state.foodEaten % config.speedIncreaseEveryFood === 0) {
      state.speed = Math.min(config.maxSpeed, state.speed + config.speedIncreaseAmount);
    }
    state.food = spawnFreeCell(state, config, rng);
  }

  if (state.pendingGrowth > 0) state.pendingGrowth -= 1;
  else state.snake.pop();

  state.seed = rng.getSeed();
};

export const buildReplay = (seed: number, config: GameConfig, events: ReplayLog['events'], finalStep: number): ReplayLog => ({
  version: 1,
  seed,
  config,
  events,
  finalStep
});

export const simulateReplay = (replay: ReplayLog): GameState => {
  const state = createInitialState(replay.seed, replay.config);
  const rng = new SeededRng(state.seed);
  const queue: Direction[] = [];
  const eventMap = new Map<number, Direction[]>();
  replay.events.forEach((evt) => {
    const arr = eventMap.get(evt.step) ?? [];
    arr.push(evt.direction);
    eventMap.set(evt.step, arr);
  });
  const max = replay.finalStep ?? Math.max(300, ...replay.events.map((e) => e.step + 20));
  while (state.step < max && state.alive) {
    eventMap.get(state.step)?.forEach((dir) => queue.push(dir));
    stepGame(state, replay.config, queue, rng);
  }
  return state;
};

export const buildReplayFrames = (replay: ReplayLog): GameState[] => {
  const state = createInitialState(replay.seed, replay.config);
  const rng = new SeededRng(state.seed);
  const queue: Direction[] = [];
  const frames: GameState[] = [{ ...state, snake: [...state.snake] }];
  const eventMap = new Map<number, Direction[]>();
  replay.events.forEach((e) => {
    const arr = eventMap.get(e.step) ?? [];
    arr.push(e.direction);
    eventMap.set(e.step, arr);
  });
  const max = replay.finalStep ?? Math.max(300, ...replay.events.map((e) => e.step + 20));
  while (state.step < max && state.alive) {
    eventMap.get(state.step)?.forEach((dir) => queue.push(dir));
    stepGame(state, replay.config, queue, rng);
    frames.push({ ...state, snake: [...state.snake] });
  }
  return frames;
};
