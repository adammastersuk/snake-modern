'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HUD } from '@/components/HUD';
import { KeyHints } from '@/components/KeyHints';
import { LeaderboardPanel, ScoreEntry } from '@/components/LeaderboardPanel';
import { MobileControls } from '@/components/MobileControls';
import { ReplayModal } from '@/components/ReplayModal';
import { SettingsPanel } from '@/components/SettingsPanel';
import { StartOverlay } from '@/components/StartOverlay';
import { Toast } from '@/components/Toast';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { buildConfigForDifficulty } from '@/lib/game/difficulty';
import { decodeReplayParam, encodeReplayParam, exportReplay, importReplay } from '@/lib/game/replay';
import { createSeed, SeededRng } from '@/lib/game/rng';
import { buildReplay, createInitialState, createReplaySnapshots, defaultConfig, enqueueDirection, simulateReplayFromSnapshot, stepGame } from '@/lib/game/simulation';
import { DebugStats, Difficulty, Direction, InputEvent, ReplayLog, RetroPalette, ThemeMode } from '@/lib/game/types';

const TILE = 24;
const LS = {
  best: 'snake-best',
  diff: 'snake-difficulty',
  practice: 'snake-practice',
  hints: 'snake-hints',
  swipe: 'snake-swipe',
  dpad: 'snake-dpad',
  palette: 'snake-retro-palette',
  localScores: 'snake-local-scores'
} as const;

const paletteMap: Record<RetroPalette, { bg: string; grid: string; snake: string; food: string }> = {
  'crt-green': { bg: '#041005', grid: 'rgba(126,255,124,0.1)', snake: '#7cff6f', food: '#d9ff66' },
  amber: { bg: '#160f05', grid: 'rgba(255,191,80,0.1)', snake: '#ffbf50', food: '#ffe8a3' },
  mono: { bg: '#0d0d0d', grid: 'rgba(255,255,255,0.08)', snake: '#f5f5f5', food: '#a3a3a3' },
  gameboy: { bg: '#1d2b53', grid: 'rgba(126,255,124,0.08)', snake: '#9bbc0f', food: '#8bac0f' }
};

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardWrapRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<ThemeMode>('modern');
  const [retroPalette, setRetroPalette] = useState<RetroPalette>('crt-green');
  const [difficulty, setDifficulty] = useState<Difficulty>('classic');
  const [practiceMode, setPracticeMode] = useState(false);
  const [wrapAround, setWrapAround] = useState(false);
  const [paused, setPaused] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [replayMode, setReplayMode] = useState(false);
  const [collapsePanels, setCollapsePanels] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(false);
  const [showKeyHints, setShowKeyHints] = useState(true);
  const [swipeEnabled, setSwipeEnabled] = useState(true);
  const [dpadEnabled, setDpadEnabled] = useState(true);
  const [toast, setToast] = useState('');
  const [shareBaseUrl, setShareBaseUrl] = useState('');
  const [juicePulse, setJuicePulse] = useState(false);
  const [scoreBump, setScoreBump] = useState('');
  const [deathFx, setDeathFx] = useState(false);
  const [localScores, setLocalScores] = useState<ScoreEntry[]>([]);
  const [globalScores, setGlobalScores] = useState<ScoreEntry[]>([]);
  const [globalEnabled, setGlobalEnabled] = useState(false);

  const cfg = useMemo(() => ({ ...defaultConfig, ...buildConfigForDifficulty(difficulty, practiceMode), wrapAround }), [difficulty, practiceMode, wrapAround]);
  const [uiState, setUiState] = useState(() => createInitialState(createSeed(), cfg));
  const [best, setBest] = useState(0);
  const [debug, setDebug] = useState<DebugStats>({ fps: 0, simSteps: 0, seed: uiState.seed, snakeLength: uiState.snake.length });
  const reducedMotion = usePrefersReducedMotion();

  const stateRef = useRef(uiState);
  const queueRef = useRef<Direction[]>([]);
  const rngRef = useRef(new SeededRng(uiState.seed));
  const eventsRef = useRef<InputEvent[]>([]);
  const fpsCounter = useRef({ frames: 0, steps: 0, last: performance.now() });
  const replayRef = useRef<ReplayLog | null>(null);
  const replaySnapshotsRef = useRef<Map<number, ReturnType<typeof createInitialState>>>(new Map());
  const [replayStep, setReplayStep] = useState(0);
  const replayExportObj = useMemo(() => buildReplay(uiState.seed, cfg, eventsRef.current, { difficulty, wrapAround, practiceMode, theme, palette: retroPalette }), [uiState.seed, cfg, uiState.step, difficulty, wrapAround, practiceMode, theme, retroPalette]);
  const replayExport = useMemo(() => exportReplay(replayExportObj), [replayExportObj]);
  const replayShareUrl = useMemo(() => {
    if (eventsRef.current.length === 0 || !shareBaseUrl) return '';
    const encoded = encodeReplayParam(replayExportObj);
    return `${shareBaseUrl}?replay=${encoded}`;
  }, [replayExportObj, shareBaseUrl]);

  const focusCanvas = () => canvasRef.current?.focus();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1600);
  };

  const reset = useCallback((seed = createSeed()) => {
    const next = createInitialState(seed, cfg);
    stateRef.current = next;
    queueRef.current = [];
    eventsRef.current = [];
    replayRef.current = null;
    replaySnapshotsRef.current = new Map();
    rngRef.current = new SeededRng(next.seed);
    setReplayMode(false);
    setReplayStep(0);
    setPaused(false);
    setStarted(false);
    setCountdown(null);
    setUiState({ ...next });
    setDeathFx(false);
    requestAnimationFrame(focusCanvas);
  }, [cfg]);

  useEffect(() => {
    setShareBaseUrl(`${window.location.origin}${window.location.pathname}`);
    const savedBest = Number(localStorage.getItem(LS.best) ?? '0');
    const savedDiff = (localStorage.getItem(LS.diff) as Difficulty | null) ?? 'classic';
    const savedPractice = localStorage.getItem(LS.practice) === '1';
    const savedHints = localStorage.getItem(LS.hints) !== '0';
    const savedSwipe = localStorage.getItem(LS.swipe) !== '0';
    const savedDpad = localStorage.getItem(LS.dpad) !== '0';
    const savedPalette = (localStorage.getItem(LS.palette) as RetroPalette | null) ?? 'crt-green';
    setBest(savedBest);
    setDifficulty(savedDiff);
    setPracticeMode(savedPractice);
    setShowKeyHints(savedHints);
    setSwipeEnabled(savedSwipe);
    setDpadEnabled(savedDpad);
    setRetroPalette(savedPalette);
    setLocalScores(JSON.parse(localStorage.getItem(LS.localScores) ?? '[]'));

    const param = new URLSearchParams(window.location.search).get('replay');
    if (param) {
      try {
        const replay = decodeReplayParam(param);
        loadReplay(replay);
        showToast('Replay loaded from URL');
      } catch {
        showToast('Invalid replay URL');
      }
    }
    fetch('/api/scores?limit=10').then((r) => r.json()).then((data) => {
      setGlobalScores(data.scores ?? []);
      setGlobalEnabled(Boolean(data.enabled));
    }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(LS.diff, difficulty);
    localStorage.setItem(LS.practice, practiceMode ? '1' : '0');
    localStorage.setItem(LS.hints, showKeyHints ? '1' : '0');
    localStorage.setItem(LS.swipe, swipeEnabled ? '1' : '0');
    localStorage.setItem(LS.dpad, dpadEnabled ? '1' : '0');
    localStorage.setItem(LS.palette, retroPalette);
  }, [difficulty, practiceMode, showKeyHints, swipeEnabled, dpadEnabled, retroPalette]);

  const handleInput = useCallback((dir: Direction) => {
    if (replayMode || !started || countdown !== null) return;
    enqueueDirection(queueRef.current, stateRef.current, dir);
    eventsRef.current.push({ step: stateRef.current.step, direction: dir });
  }, [replayMode, started, countdown]);

  const beginRun = useCallback(() => {
    if (started) return;
    setStarted(true);
    if (skipCountdown) return;
    setCountdown(3);
  }, [started, skipCountdown]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 1) {
      const t = setTimeout(() => setCountdown(null), 550);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCountdown((v) => (v ? v - 1 : null)), 550);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', a: 'left', s: 'down', d: 'right' };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        if (!started) beginRun();
        handleInput(dir);
      }
      if (e.key === ' ') { e.preventDefault(); !started ? beginRun() : setPaused((p) => !p); }
      if (e.key.toLowerCase() === 'r') reset();
      if (e.key === 'Escape') setCollapsePanels(false);
    };
    canvas.addEventListener('keydown', onKey);
    return () => canvas.removeEventListener('keydown', onKey);
  }, [handleInput, reset, beginRun, started]);

  useEffect(() => {
    let touchStart: { x: number; y: number } | null = null;
    const canvas = canvasRef.current;
    if (!canvas || !swipeEnabled) return;
    const start = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      touchStart = { x: t.clientX, y: t.clientY };
      if (!started) beginRun();
    };
    const end = (e: TouchEvent) => {
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      handleInput(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    };
    canvas.addEventListener('touchstart', start, { passive: true });
    canvas.addEventListener('touchend', end, { passive: true });
    return () => {
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchend', end);
    };
  }, [swipeEnabled, handleInput, started, beginRun]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let accumulator = 0;

    const frame = (ts: number) => {
      const elapsed = Math.min(100, ts - last);
      last = ts;
      accumulator += elapsed;
      const state = stateRef.current;
      const tickMs = 1000 / (state.speed * (state.effects.some((e) => e.type === 'slow') ? 0.6 : 1));

      while (accumulator >= tickMs) {
        if (!paused && started && countdown === null) {
          if (replayRef.current) {
            replayRef.current.events.filter((ev) => ev.step === state.step).forEach((ev) => queueRef.current.push(ev.direction));
          }
          const prevScore = state.score;
          const prevPower = state.powerUp;
          stepGame(state, cfg, queueRef.current, rngRef.current);
          if (state.score > prevScore) {
            setJuicePulse(true);
            setScoreBump(`+${state.score - prevScore}`);
            setTimeout(() => setJuicePulse(false), 180);
            setTimeout(() => setScoreBump(''), 420);
          }
          if (state.powerUp && state.powerUp !== prevPower && !reducedMotion) {
            boardWrapRef.current?.animate([{ opacity: 0.88 }, { opacity: 1 }], { duration: 260 });
          }
          fpsCounter.current.steps += 1;
          if (!state.alive) {
            setDeathFx(true);
            const replay = replayExportObj;
            const scoreEntry: ScoreEntry = {
              score: state.score,
              mode: theme,
              created_at: new Date().toISOString(),
              difficulty,
              wrap: wrapAround,
              practice: practiceMode,
              theme,
              palette: retroPalette,
              replay
            };
            const nextScores = [scoreEntry, ...localScores].slice(0, 20);
            setLocalScores(nextScores);
            localStorage.setItem(LS.localScores, JSON.stringify(nextScores));
            if (globalEnabled && state.score > 0) {
              fetch('/api/scores', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ score: state.score, mode: theme, replay, difficulty, wrap: wrapAround, practice: practiceMode, palette: retroPalette }) })
                .then(() => fetch('/api/scores?limit=10')).then((r) => r?.json()).then((d) => d && setGlobalScores(d.scores ?? []))
                .catch(() => undefined);
            }
          }
        }
        accumulator -= tickMs;
      }

      draw(canvasRef.current, state, theme, reducedMotion, retroPalette, juicePulse, deathFx);

      fpsCounter.current.frames += 1;
      if (ts - fpsCounter.current.last > 1000) {
        const visibleBest = Math.max(best, state.score);
        if (visibleBest !== best) {
          setBest(visibleBest);
          localStorage.setItem(LS.best, String(visibleBest));
        }
        setDebug({ fps: fpsCounter.current.frames, simSteps: fpsCounter.current.steps, seed: state.seed, snakeLength: state.snake.length });
        fpsCounter.current = { frames: 0, steps: 0, last: ts };
        setUiState({ ...state, snake: [...state.snake], effects: [...state.effects] });
      }

      if (replayMode) setReplayStep(state.step);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [cfg, paused, started, countdown, theme, reducedMotion, best, replayMode, juicePulse, deathFx, replayExportObj, localScores, globalEnabled, difficulty, wrapAround, practiceMode, retroPalette]);

  const loadReplay = (replay: ReplayLog) => {
    replayRef.current = replay;
    const initial = createInitialState(replay.seed, replay.config);
    stateRef.current = initial;
    rngRef.current = new SeededRng(initial.seed);
    queueRef.current = [];
    setReplayMode(true);
    setPaused(false);
    setStarted(true);
    setCountdown(null);
    replaySnapshotsRef.current = createReplaySnapshots(replay, 20);
    setReplayStep(0);
  };

  const onImportReplay = (json: string) => {
    loadReplay(importReplay(json));
    showToast('Replay imported');
  };

  const onReplayScrub = (step: number) => {
    if (!replayRef.current) return;
    setPaused(true);
    const state = simulateReplayFromSnapshot(replayRef.current, step, replaySnapshotsRef.current, 20);
    stateRef.current = state;
    setReplayStep(step);
    setUiState({ ...state, snake: [...state.snake], effects: [...state.effects] });
  };

  return (
    <main className={`mx-auto max-w-7xl p-4 ${theme === 'retro' ? 'retro-scanlines retro-font' : 'modern-bg'}`}>
      <Toast message={toast} />
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Snake: Modern / Retro</h1>
        <button className="rounded bg-white/15 px-3 py-2" onClick={() => setCollapsePanels((v) => !v)}>{collapsePanels ? 'Show Panels' : 'Collapse Panels'}</button>
      </div>
      <div className={`grid gap-4 ${collapsePanels ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_290px]'}`}>
        <section>
          <HUD score={uiState.score} best={Math.max(best, uiState.score)} speed={uiState.speed} length={uiState.snake.length} replayMode={replayMode} difficultyLabel={difficulty} practiceMode={practiceMode} />
          {showKeyHints && <KeyHints />}
          <div ref={boardWrapRef} className={`relative mt-4 overflow-hidden rounded-2xl border border-white/20 ${deathFx && !reducedMotion ? 'animate-pulse' : ''}`}>
            <canvas ref={canvasRef} tabIndex={0} onClick={() => { focusCanvas(); if (!started) beginRun(); }} width={defaultConfig.width * TILE} height={defaultConfig.height * TILE} className="aspect-square w-full max-w-[820px] bg-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" aria-label="Snake game board" />
            <StartOverlay countdown={countdown} started={started} difficulty={difficulty} onStart={beginRun} />
            {scoreBump && <div className="pointer-events-none absolute right-4 top-4 rounded bg-emerald-500/80 px-2 py-1 text-sm">{scoreBump}</div>}
          </div>
          <div className="mt-3 flex items-center gap-3"><MobileControls onInput={handleInput} showDpad={dpadEnabled} /></div>
          {debugEnabled && <div className="mt-3 rounded-lg bg-black/40 p-2 text-xs">FPS: {debug.fps} | Steps/s: {debug.simSteps} | Length: {debug.snakeLength} | Seed: {debug.seed}</div>}
        </section>

        {!collapsePanels && (
          <div className="space-y-4 lg:sticky lg:top-3 lg:h-[calc(100vh-1.5rem)] lg:overflow-auto">
            <SettingsPanel
              theme={theme}
              wrapAround={wrapAround}
              paused={paused}
              reducedMotion={reducedMotion}
              debug={debugEnabled}
              practiceMode={practiceMode}
              difficulty={difficulty}
              retroPalette={retroPalette}
              skipCountdown={skipCountdown}
              showKeyHints={showKeyHints}
              swipeEnabled={swipeEnabled}
              dpadEnabled={dpadEnabled}
              onThemeChange={setTheme}
              onWrapChange={setWrapAround}
              onPauseToggle={() => setPaused((p) => !p)}
              onRestart={() => reset()}
              onDebugToggle={() => setDebugEnabled((v) => !v)}
              onPracticeModeChange={setPracticeMode}
              onDifficultyChange={setDifficulty}
              onPaletteChange={setRetroPalette}
              onSkipCountdownChange={setSkipCountdown}
              onShowKeyHintsChange={setShowKeyHints}
              onSwipeChange={setSwipeEnabled}
              onDpadChange={setDpadEnabled}
            />
            <ReplayModal replayJson={replayExport} hasReplay={eventsRef.current.length > 0} replayShareUrl={replayShareUrl} replayMode={replayMode} replayStep={replayStep} maxReplayStep={replayRef.current?.events.at(-1)?.step ?? uiState.step} onImport={onImportReplay} onCopyJson={() => navigator.clipboard.writeText(replayExport).then(() => showToast('Copied replay JSON'))} onCopyShareLink={() => replayShareUrl && navigator.clipboard.writeText(replayShareUrl).then(() => showToast('Copied share link'))} onReplayScrub={onReplayScrub} />
            <LeaderboardPanel localScores={localScores} globalScores={globalScores} globalEnabled={globalEnabled} onWatchReplay={loadReplay} />
          </div>
        )}
      </div>
    </main>
  );
}

function draw(canvas: HTMLCanvasElement | null, state: ReturnType<typeof createInitialState>, theme: ThemeMode, reducedMotion: boolean, retroPalette: RetroPalette, pulse: boolean, deathFx: boolean) {
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
    ctx.fillStyle = paletteMap[retroPalette].bg;
  }
  ctx.fillRect(0, 0, width, height);

  if (theme === 'retro') {
    ctx.strokeStyle = paletteMap[retroPalette].grid;
    for (let x = 0; x < width; x += TILE) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += TILE) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  }

  state.snake.forEach((s, i) => {
    ctx.fillStyle = theme === 'modern' ? `rgba(56, 189, 248, ${Math.max(0.35, 1 - i * 0.04)})` : paletteMap[retroPalette].snake;
    if (theme === 'modern' && !reducedMotion) { ctx.shadowBlur = pulse ? 18 : 10; ctx.shadowColor = '#38bdf8'; }
    ctx.fillRect(s.x * TILE + 2, s.y * TILE + 2, TILE - 4, TILE - 4);
    ctx.shadowBlur = 0;
  });

  ctx.fillStyle = theme === 'modern' ? '#f97316' : paletteMap[retroPalette].food;
  ctx.beginPath();
  ctx.arc(state.food.x * TILE + TILE / 2, state.food.y * TILE + TILE / 2, pulse && !reducedMotion ? TILE / 2.5 : TILE / 2.9, 0, Math.PI * 2);
  ctx.fill();

  if (state.powerUp) {
    const map = { slow: '#22d3ee', multiplier: '#a855f7', ghost: '#f43f5e' };
    if (!reducedMotion) { ctx.shadowBlur = 12; ctx.shadowColor = map[state.powerUp.type]; }
    ctx.fillStyle = map[state.powerUp.type];
    ctx.fillRect(state.powerUp.position.x * TILE + 4, state.powerUp.position.y * TILE + 4, TILE - 8, TILE - 8);
    ctx.shadowBlur = 0;
  }

  if (!state.alive) {
    ctx.fillStyle = deathFx && !reducedMotion ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Game Over', width / 2 - 80, height / 2);
  }
}
