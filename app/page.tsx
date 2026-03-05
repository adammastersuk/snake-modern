'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HUD } from '@/components/HUD';
import { MobileControls } from '@/components/MobileControls';
import { ReplayModal } from '@/components/ReplayModal';
import { SettingsPanel } from '@/components/SettingsPanel';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { createSeed, SeededRng } from '@/lib/game/rng';
import { buildReplay, createInitialState, defaultConfig, enqueueDirection, stepGame } from '@/lib/game/simulation';
import { exportReplay, importReplay } from '@/lib/game/replay';
import { DebugStats, Direction, InputEvent, ReplayLog, ThemeMode } from '@/lib/game/types';

const TILE = 20;

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [theme, setTheme] = useState<ThemeMode>('modern');
  const [wrapAround, setWrapAround] = useState(false);
  const [paused, setPaused] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [replayMode, setReplayMode] = useState(false);
  const [uiState, setUiState] = useState(() => createInitialState(createSeed(), { ...defaultConfig, wrapAround: false }));
  const [best, setBest] = useState(0);
  const [debug, setDebug] = useState<DebugStats>({ fps: 0, simSteps: 0, seed: uiState.seed, snakeLength: uiState.snake.length });
  const reducedMotion = usePrefersReducedMotion();

  const stateRef = useRef(uiState);
  const queueRef = useRef<Direction[]>([]);
  const rngRef = useRef(new SeededRng(uiState.seed));
  const eventsRef = useRef<InputEvent[]>([]);
  const fpsCounter = useRef({ frames: 0, steps: 0, last: performance.now() });
  const replayRef = useRef<ReplayLog | null>(null);
  const replayExport = useMemo(() => exportReplay(buildReplay(uiState.seed, { ...defaultConfig, wrapAround }, eventsRef.current)), [uiState.seed, wrapAround, uiState.step]);

  const reset = useCallback((seed = createSeed()) => {
    const cfg = { ...defaultConfig, wrapAround };
    const next = createInitialState(seed, cfg);
    stateRef.current = next;
    queueRef.current = [];
    eventsRef.current = [];
    replayRef.current = null;
    rngRef.current = new SeededRng(next.seed);
    setReplayMode(false);
    setUiState({ ...next });
  }, [wrapAround]);

  useEffect(() => {
    const saved = Number(localStorage.getItem('snake-best') ?? '0');
    setBest(saved);
  }, []);

  const handleInput = useCallback((dir: Direction) => {
    if (replayMode) return;
    enqueueDirection(queueRef.current, stateRef.current, dir);
    eventsRef.current.push({ step: stateRef.current.step, direction: dir });
  }, [replayMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        a: 'left',
        s: 'down',
        d: 'right'
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        handleInput(dir);
      }
      if (e.key === ' ') setPaused((p) => !p);
      if (e.key.toLowerCase() === 'r') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleInput, reset]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let accumulator = 0;

    const frame = (ts: number) => {
      const elapsed = Math.min(100, ts - last);
      last = ts;
      accumulator += elapsed;
      const state = stateRef.current;
      const cfg = { ...defaultConfig, wrapAround };
      const tickMs = 1000 / (state.speed * (state.effects.some((e) => e.type === 'slow') ? 0.6 : 1));

      while (accumulator >= tickMs) {
        if (!paused) {
          if (replayRef.current) {
            replayRef.current.events.filter((ev) => ev.step === state.step).forEach((ev) => queueRef.current.push(ev.direction));
          }
          stepGame(state, cfg, queueRef.current, rngRef.current);
          fpsCounter.current.steps += 1;
        }
        accumulator -= tickMs;
      }

      draw(canvasRef.current, state, theme, reducedMotion);

      fpsCounter.current.frames += 1;
      if (ts - fpsCounter.current.last > 1000) {
        setDebug({
          fps: fpsCounter.current.frames,
          simSteps: fpsCounter.current.steps,
          seed: state.seed,
          snakeLength: state.snake.length
        });
        fpsCounter.current = { frames: 0, steps: 0, last: ts };
        setUiState({ ...state, snake: [...state.snake], effects: [...state.effects] });

        if (!state.alive && state.score > best) {
          setBest(state.score);
          localStorage.setItem('snake-best', String(state.score));
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [theme, paused, wrapAround, reducedMotion, best]);

  const onImportReplay = (json: string) => {
    const replay = importReplay(json);
    replayRef.current = replay;
    const initial = createInitialState(replay.seed, replay.config);
    stateRef.current = initial;
    rngRef.current = new SeededRng(initial.seed);
    queueRef.current = [];
    setReplayMode(true);
    setPaused(false);
  };

  return (
    <main className={`mx-auto max-w-6xl p-4 ${theme === 'retro' ? 'retro-scanlines' : ''}`}>
      <h1 className="mb-4 text-3xl font-bold">Snake: Modern / Retro</h1>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section>
          <HUD score={uiState.score} best={best} speed={uiState.speed} length={uiState.snake.length} replayMode={replayMode} />
          <canvas
            ref={canvasRef}
            width={defaultConfig.width * TILE}
            height={defaultConfig.height * TILE}
            className="mt-4 w-full max-w-[560px] rounded-xl border border-white/20 bg-black/40"
            aria-label="Snake game board"
          />
          <div className="mt-3 flex items-center gap-3">
            <MobileControls onInput={handleInput} />
          </div>
          {debugEnabled && (
            <div className="mt-3 rounded-lg bg-black/40 p-2 text-xs">
              FPS: {debug.fps} | Steps/s: {debug.simSteps} | Length: {debug.snakeLength} | Seed: {debug.seed}
            </div>
          )}
        </section>
        <div className="space-y-4">
          <SettingsPanel
            theme={theme}
            wrapAround={wrapAround}
            paused={paused}
            reducedMotion={reducedMotion}
            debug={debugEnabled}
            onThemeChange={setTheme}
            onWrapChange={setWrapAround}
            onPauseToggle={() => setPaused((p) => !p)}
            onRestart={() => reset()}
            onDebugToggle={() => setDebugEnabled((v) => !v)}
          />
          <ReplayModal replayJson={replayExport} onImport={onImportReplay} />
        </div>
      </div>
    </main>
  );
}

function draw(canvas: HTMLCanvasElement | null, state: ReturnType<typeof createInitialState>, theme: ThemeMode, reducedMotion: boolean) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  if (theme === 'modern') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0a1026');
    grad.addColorStop(1, '#1f2a4d');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = '#0d0f10';
  }
  ctx.fillRect(0, 0, width, height);

  if (theme === 'retro') {
    ctx.strokeStyle = 'rgba(127, 255, 80, 0.08)';
    for (let x = 0; x < width; x += TILE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += TILE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  const alphaTrail = reducedMotion ? 1 : 0.6;
  state.snake.forEach((s, i) => {
    ctx.fillStyle = theme === 'modern' ? `rgba(56, 189, 248, ${Math.max(0.35, 1 - i * 0.04)})` : '#7cff6f';
    if (theme === 'modern' && !reducedMotion) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#38bdf8';
      ctx.globalAlpha = alphaTrail;
    }
    ctx.fillRect(s.x * TILE + 2, s.y * TILE + 2, TILE - 4, TILE - 4);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  });

  ctx.fillStyle = theme === 'modern' ? '#f97316' : '#ffd166';
  ctx.beginPath();
  ctx.arc(state.food.x * TILE + TILE / 2, state.food.y * TILE + TILE / 2, TILE / 2.8, 0, Math.PI * 2);
  ctx.fill();

  if (state.powerUp) {
    const map = { slow: '#22d3ee', multiplier: '#a855f7', ghost: '#f43f5e' };
    ctx.fillStyle = map[state.powerUp.type];
    ctx.fillRect(state.powerUp.position.x * TILE + 4, state.powerUp.position.y * TILE + 4, TILE - 8, TILE - 8);
  }

  if (!state.alive) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Game Over', width / 2 - 80, height / 2);
  }
}
