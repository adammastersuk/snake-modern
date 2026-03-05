import { SeededRng } from '@/lib/game/rng';
import { Direction, GameConfig, GameState, Point, PowerUp, PowerUpType, ReplayLog } from '@/lib/game/types';

export const defaultConfig: GameConfig = {
  width: 24,
  height: 24,
  initialSpeed: 8,
  speedIncreaseEvery: 3,
  speedIncreaseAmount: 0.6,
  maxSpeed: 18,
  wrapAround: false,
  powerUpChance: 0.08,
  practiceMode: false
};

const dirs: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const isOpposite = (a: Direction, b: Direction) =>
  (a === 'up' && b === 'down') || (a === 'down' && b === 'up') || (a === 'left' && b === 'right') || (a === 'right' && b === 'left');

export const createInitialState = (seed: number, config: GameConfig = defaultConfig): GameState => {
  const rng = new SeededRng(seed);
  const snake: Point[] = [
    { x: Math.floor(config.width / 2), y: Math.floor(config.height / 2) },
    { x: Math.floor(config.width / 2) - 1, y: Math.floor(config.height / 2) }
  ];

  const state: GameState = {
    snake,
    direction: 'right',
    pendingGrowth: 0,
    food: { x: 0, y: 0 },
    powerUp: null,
    effects: [],
    score: 0,
    alive: true,
    step: 0,
    speed: config.initialSpeed,
    seed,
    multiplier: 1
  };

  state.food = spawnFreeCell(state, config, rng);
  state.seed = rng.getSeed();
  return state;
};

export const enqueueDirection = (queue: Direction[], state: GameState, direction: Direction) => {
  const last = queue[queue.length - 1] ?? state.direction;
  if (isOpposite(last, direction) || last === direction) return;
  queue.push(direction);
  if (queue.length > 3) queue.shift();
};

const pointEq = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

export const spawnFreeCell = (state: GameState, config: GameConfig, rng: SeededRng): Point => {
  const occupied = new Set(state.snake.map((s) => `${s.x},${s.y}`));
  if (state.powerUp) occupied.add(`${state.powerUp.position.x},${state.powerUp.position.y}`);
  const free: Point[] = [];
  for (let x = 0; x < config.width; x++) {
    for (let y = 0; y < config.height; y++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  return free[rng.int(free.length)] ?? { x: 0, y: 0 };
};

const effectActive = (state: GameState, type: PowerUpType) => state.effects.some((e) => e.type === type && e.untilStep > state.step);

const updateEffects = (state: GameState) => {
  state.effects = state.effects.filter((e) => e.untilStep > state.step);
  state.multiplier = effectActive(state, 'multiplier') ? 2 : 1;
};

const maybeSpawnPowerUp = (state: GameState, config: GameConfig, rng: SeededRng) => {
  if (state.powerUp || rng.next() > config.powerUpChance) return;
  const types: PowerUpType[] = ['slow', 'multiplier', 'ghost'];
  state.powerUp = {
    position: spawnFreeCell(state, config, rng),
    type: types[rng.int(types.length)],
    spawnedAtStep: state.step
  };
};

const consumePowerUp = (state: GameState, powerUp: PowerUp) => {
  const duration = 24;
  state.effects.push({ type: powerUp.type, untilStep: state.step + duration });
  state.powerUp = null;
};

export const stepGame = (state: GameState, config: GameConfig, inputQueue: Direction[], rng: SeededRng): GameState => {
  if (!state.alive) return state;

  if (inputQueue.length > 0) {
    const next = inputQueue.shift();
    if (next) state.direction = next;
  }

  state.step += 1;
  updateEffects(state);

  const delta = dirs[state.direction];
  const head = state.snake[0];
  let next: Point = { x: head.x + delta.x, y: head.y + delta.y };

  if (config.wrapAround) {
    next = {
      x: (next.x + config.width) % config.width,
      y: (next.y + config.height) % config.height
    };
  }

  if (!config.wrapAround && (next.x < 0 || next.y < 0 || next.x >= config.width || next.y >= config.height)) {
    state.alive = false;
    return state;
  }

  const willGhost = effectActive(state, 'ghost');
  const body = state.pendingGrowth > 0 ? state.snake : state.snake.slice(0, -1);
  if (!config.practiceMode && !willGhost && body.some((s) => pointEq(s, next))) {
    state.alive = false;
    return state;
  }

  state.snake.unshift(next);

  if (pointEq(next, state.food)) {
    state.pendingGrowth += 1;
    state.score += 10 * state.multiplier;
    state.food = spawnFreeCell(state, config, rng);
    if (config.speedIncreaseAmount > 0 && Math.floor(state.score / 10) % config.speedIncreaseEvery === 0) {
      state.speed = Math.min(config.maxSpeed, state.speed + config.speedIncreaseAmount);
    }
    maybeSpawnPowerUp(state, config, rng);
  }

  if (state.powerUp && pointEq(next, state.powerUp.position)) {
    consumePowerUp(state, state.powerUp);
  }

  if (state.pendingGrowth > 0) {
    state.pendingGrowth -= 1;
  } else {
    state.snake.pop();
  }

  if (state.powerUp && state.step - state.powerUp.spawnedAtStep > 40) {
    state.powerUp = null;
  }

  state.seed = rng.getSeed();
  return state;
};

export const buildReplay = (seed: number, config: GameConfig, events: ReplayLog['events'], meta?: ReplayLog['meta']): ReplayLog => ({
  seed,
  config,
  events,
  meta
});

export const simulateReplay = (replay: ReplayLog, toStep?: number): GameState => {
  const state = createInitialState(replay.seed, replay.config);
  const queue: Direction[] = [];
  const rng = new SeededRng(state.seed);
  const maxStep = replay.events[replay.events.length - 1]?.step ?? 0;
  const stopAt = toStep ?? maxStep + 250;
  for (let step = 0; step <= stopAt && state.alive; step++) {
    replay.events.filter((ev) => ev.step === step).forEach((ev) => queue.push(ev.direction));
    stepGame(state, replay.config, queue, rng);
  }
  return state;
};

export const createReplaySnapshots = (replay: ReplayLog, every = 20) => {
  const snapshots = new Map<number, GameState>();
  const state = createInitialState(replay.seed, replay.config);
  const queue: Direction[] = [];
  const rng = new SeededRng(state.seed);
  const maxStep = replay.events[replay.events.length - 1]?.step ?? 0;
  snapshots.set(0, structuredClone(state));

  for (let step = 0; step <= maxStep + 250 && state.alive; step++) {
    replay.events.filter((ev) => ev.step === step).forEach((ev) => queue.push(ev.direction));
    stepGame(state, replay.config, queue, rng);
    if (step % every === 0) snapshots.set(step, structuredClone(state));
  }

  return snapshots;
};

export const simulateReplayFromSnapshot = (replay: ReplayLog, targetStep: number, snapshots: Map<number, GameState>, every = 20): GameState => {
  const checkpoint = Math.floor(targetStep / every) * every;
  const base = snapshots.get(checkpoint);
  if (!base) return simulateReplay(replay, targetStep);

  const state = structuredClone(base);
  const queue: Direction[] = [];
  const rng = new SeededRng(state.seed);

  for (let step = checkpoint; step <= targetStep && state.alive; step++) {
    replay.events.filter((ev) => ev.step === step).forEach((ev) => queue.push(ev.direction));
    stepGame(state, replay.config, queue, rng);
  }

  return state;
};
