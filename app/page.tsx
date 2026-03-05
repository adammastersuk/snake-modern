'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HUD } from '@/components/HUD';
import { KeyHints } from '@/components/KeyHints';
import { LeaderboardPanel } from '@/components/LeaderboardPanel';
import { MobileControls } from '@/components/MobileControls';
import { MobileDrawer } from '@/components/MobileDrawer';
import { ReplayPanel } from '@/components/ReplayPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { StartOverlay } from '@/components/StartOverlay';
import { Toast } from '@/components/Toast';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { buildGameConfig } from '@/lib/game/difficulty';
import { compressReplay, exportReplay, importReplay } from '@/lib/game/replay';
import { createSeed, SeededRng } from '@/lib/game/rng';
import { buildReplay, buildReplayFrames, createInitialState, enqueueDirection, stepGame } from '@/lib/game/simulation';
import { Difficulty, Direction, InputEvent, ScoreEntry, ThemeMode } from '@/lib/game/types';

const DEFAULT_TILE = 22;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [theme, setTheme] = useState<ThemeMode>('modern');
  const [difficulty, setDifficulty] = useState<Difficulty>('classic');
  const [wrapAround, setWrapAround] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [showDpad, setShowDpad] = useState(true);
  const [paused, setPaused] = useState(true);
  const [toast, setToast] = useState('');
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState(0);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [replayFrames, setReplayFrames] = useState<ReturnType<typeof buildReplayFrames>>([]);
  const [replayFrame, setReplayFrame] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [canvasFocused, setCanvasFocused] = useState(false);
  const [showMobileHint, setShowMobileHint] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(false);
  const pausedBeforeDrawer = useRef(true);
  const reduceMotion = usePrefersReducedMotion();

  const config = useMemo(() => buildGameConfig(difficulty, practiceMode, wrapAround), [difficulty, practiceMode, wrapAround]);
  const [uiState, setUiState] = useState(() => createInitialState(createSeed(), config));
  const [canvasMetrics, setCanvasMetrics] = useState({ tile: DEFAULT_TILE, cssWidth: config.width * DEFAULT_TILE, cssHeight: config.height * DEFAULT_TILE, dpr: 1 });
  const stateRef = useRef(uiState);
  const queueRef = useRef<Direction[]>([]);
  const rngRef = useRef(new SeededRng(uiState.seed));
  const eventsRef = useRef<InputEvent[]>([]);

  const replayLog = useMemo(() => buildReplay(uiState.seed, config, eventsRef.current, stateRef.current.step), [uiState.step, uiState.seed, config]);
  const replayJson = useMemo(() => exportReplay(replayLog), [replayLog]);
  const replayLink = useMemo(() => `?replay=${encodeURIComponent(compressReplay(replayLog))}`, [replayLog]);

  const reset = useCallback((seed = createSeed()) => {
    const next = createInitialState(seed, config);
    stateRef.current = next;
    rngRef.current = new SeededRng(next.seed);
    queueRef.current = [];
    eventsRef.current = [];
    setPaused(true);
    setRunning(false);
    setUiState({ ...next, snake: [...next.snake] });
    setReplayFrames([]);
    setReplayFrame(0);
  }, [config]);

  useEffect(() => reset(), [config, reset]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const incoming = new URLSearchParams(window.location.search).get('replay');
    if (incoming) {
      try {
        const replay = importReplay(incoming);
        const frames = buildReplayFrames(replay);
        setReplayFrames(frames);
        setReplayFrame(0);
        setPaused(true);
        setRunning(false);
        setToast('Loaded replay from link');
      } catch {
        setToast('Unable to load replay link');
      }
    }
  }, []);

  useEffect(() => {
    const saved = Number(localStorage.getItem('snake-best') ?? '0');
    setBest(saved);
    fetch('/api/scores').then((r) => r.json()).then((d) => setScores(d.scores ?? [])).catch(() => undefined);
    setShowMobileHint(localStorage.getItem('snake-mobile-hint-dismissed') !== '1');
    setHapticsEnabled(localStorage.getItem('snake-haptics') === '1');
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    localStorage.setItem('snake-haptics', hapticsEnabled ? '1' : '0');
  }, [hapticsEnabled]);

  const input = useCallback((dir: Direction) => {
    enqueueDirection(queueRef.current, stateRef.current, dir);
    eventsRef.current.push({ step: stateRef.current.step, direction: dir });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', a: 'left', s: 'down', d: 'right' };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        input(dir);
      }
      if (e.key === ' ') {
        e.preventDefault();
        setRunning(true);
        setPaused((p) => !p);
      }
      if (e.key.toLowerCase() === 'r') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [input, reset]);

  useEffect(() => {
    const target = canvasRef.current;
    if (!target) return;
    let startX = 0;
    let startY = 0;
    const touchStart = (e: TouchEvent) => {
      e.preventDefault();
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      setCanvasFocused(true);
    };
    const touchMove = (e: TouchEvent) => {
      e.preventDefault();
    };
    const touchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dx) > Math.abs(dy)) input(dx > 0 ? 'right' : 'left');
      else input(dy > 0 ? 'down' : 'up');
    };
    target.addEventListener('touchstart', touchStart, { passive: false });
    target.addEventListener('touchmove', touchMove, { passive: false });
    target.addEventListener('touchend', touchEnd, { passive: false });
    return () => {
      target.removeEventListener('touchstart', touchStart);
      target.removeEventListener('touchmove', touchMove);
      target.removeEventListener('touchend', touchEnd);
    };
  }, [input]);

  useEffect(() => {
    const onResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const horizontalPadding = isMobile ? 20 : 32;
      const viewportWidth = Math.max(320, window.innerWidth);
      const widthLimit = viewportWidth - horizontalPadding;
      const heightLimit = isMobile
        ? Math.max(180, window.innerHeight - (showDpad ? 330 : 210))
        : Math.max(360, window.innerHeight - 260);

      const tileByWidth = Math.floor(widthLimit / config.width);
      const tileByHeight = Math.floor(heightLimit / config.height);
      const nextTile = Math.max(12, Math.min(DEFAULT_TILE, tileByWidth, tileByHeight));
      const cssWidth = nextTile * config.width;
      const cssHeight = nextTile * config.height;

      setCanvasMetrics({ tile: nextTile, cssWidth, cssHeight, dpr });
    };

    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [config.height, config.width, isMobile, showDpad]);

  const mobilePlayMode = isMobile && !drawerOpen && (running || canvasFocused);

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    if (mobilePlayMode) {
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';
      body.style.touchAction = 'none';
    } else {
      body.style.overflow = '';
      html.style.overflow = '';
      body.style.touchAction = '';
    }

    return () => {
      body.style.overflow = '';
      html.style.overflow = '';
      body.style.touchAction = '';
    };
  }, [mobilePlayMode]);

  useEffect(() => {
    if (!mobilePlayMode) return;
    const guardTouchScroll = (event: TouchEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-mobile-drawer-scroll="true"]')) return;
      event.preventDefault();
    };
    document.addEventListener('touchmove', guardTouchScroll, { passive: false });
    return () => document.removeEventListener('touchmove', guardTouchScroll);
  }, [mobilePlayMode]);

  useEffect(() => {
    if (!isMobile) return;
    if (drawerOpen) {
      pausedBeforeDrawer.current = paused;
      setPaused(true);
      return;
    }

    setPaused(pausedBeforeDrawer.current);
  }, [drawerOpen, isMobile]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let accumulator = 0;

    const tick = (ts: number) => {
      const dt = Math.min(100, ts - last);
      last = ts;
      accumulator += dt;
      const frameMs = 1000 / stateRef.current.speed;

      while (accumulator >= frameMs) {
        if (!paused && running && replayFrames.length === 0) {
          stepGame(stateRef.current, config, queueRef.current, rngRef.current);
          if (!stateRef.current.alive) {
            setPaused(true);
            setRunning(false);
          }
        }
        accumulator -= frameMs;
      }

      if (replayFrames.length > 0) {
        const frame = replayFrames[replayFrame] ?? replayFrames.at(-1);
        if (frame) draw(canvasRef.current, frame, theme, canvasMetrics.tile * canvasMetrics.dpr);
      } else {
        draw(canvasRef.current, stateRef.current, theme, canvasMetrics.tile * canvasMetrics.dpr);
      }

      setUiState({ ...stateRef.current, snake: [...stateRef.current.snake] });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [config, paused, running, replayFrames, replayFrame, theme, canvasMetrics]);

  useEffect(() => {
    if (!uiState.alive && uiState.score > best) {
      setBest(uiState.score);
      localStorage.setItem('snake-best', String(uiState.score));
    }
  }, [uiState.alive, uiState.score, best]);

  const loadReplay = (raw: string) => {
    try {
      const cleaned = raw.trim();
      let payload = cleaned;
      if (/^https?:\/\//i.test(cleaned)) {
        const url = new URL(cleaned);
        payload = url.searchParams.get('replay') ?? cleaned;
      }
      const replay = importReplay(payload);
      const frames = buildReplayFrames(replay);
      setReplayFrames(frames);
      setReplayFrame(0);
      setPaused(true);
      setRunning(false);
      setToast('Replay loaded');
    } catch {
      setToast('Invalid replay');
    }
  };

  const submitScore = async () => {
    if (uiState.alive || uiState.score <= 0) return setToast('Finish a run first');
    const payload = { score: uiState.score, length: uiState.snake.length, difficulty, mode: theme, wrapAround, practiceMode, replay: replayLog };
    const res = await fetch('/api/scores', { method: 'POST', body: JSON.stringify(payload) });
    if (!res.ok) return setToast('Score submit failed');
    const list = await fetch('/api/scores').then((r) => r.json());
    setScores(list.scores ?? []);
    setToast('Score submitted');
  };

  return (
    <main className={`mx-auto max-w-7xl overflow-x-hidden px-3 pb-44 pt-3 md:p-4 md:pb-4 ${theme === 'modern' ? 'modern-bg' : 'retro-font retro-scanlines'}`}>
      <h1 className="mb-3 text-2xl font-bold sm:text-3xl">Modern Snake</h1>
      <div className="grid max-w-full gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <HUD score={uiState.score} best={best} speed={uiState.speed} length={uiState.snake.length} />
            <button className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium lg:hidden" onClick={() => setDrawerOpen(true)}>
              Game Settings
            </button>
          </div>
          {showMobileHint && isMobile && (
            <div className="mb-2 flex items-start justify-between gap-2 rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-2 text-xs">
              <p>Tip: Controls are pinned at the bottom. Swipe the board to steer and tap Game Settings to tune your run or watch replays.</p>
              <button
                type="button"
                className="rounded border border-white/20 px-2 py-1"
                onClick={() => {
                  setShowMobileHint(false);
                  localStorage.setItem('snake-mobile-hint-dismissed', '1');
                }}
              >
                Dismiss
              </button>
            </div>
          )}
          <div className="relative mt-2 max-w-full touch-none select-none overscroll-none" onPointerDown={() => setCanvasFocused(true)}>
            <StartOverlay running={running} alive={uiState.alive} onStart={() => { setRunning(true); setPaused(false); }} />
            <div className="mx-auto w-full max-w-full overflow-hidden rounded-2xl border border-white/20">
              <canvas
                ref={canvasRef}
                width={Math.floor(canvasMetrics.cssWidth * canvasMetrics.dpr)}
                height={Math.floor(canvasMetrics.cssHeight * canvasMetrics.dpr)}
                className="game-touch-area block max-w-full bg-black/40"
                style={{ width: `${canvasMetrics.cssWidth}px`, height: `${canvasMetrics.cssHeight}px`, marginInline: 'auto' }}
                onFocus={() => setCanvasFocused(true)}
                onBlur={() => setCanvasFocused(false)}
                tabIndex={0}
                aria-label="Snake game board"
              />
            </div>
          </div>
          <div className="mt-2 hidden md:block">
            <KeyHints />
          </div>
        </section>
        <aside className="hidden space-y-3 lg:sticky lg:top-4 lg:block lg:h-fit">
          <SettingsPanel theme={theme} difficulty={difficulty} wrapAround={wrapAround} practiceMode={practiceMode} showDpad={showDpad} paused={paused} onThemeChange={setTheme} onDifficultyChange={setDifficulty} onWrapChange={setWrapAround} onPracticeModeChange={setPracticeMode} onShowDpadChange={setShowDpad} onPauseToggle={() => setPaused((p) => !p)} onRestart={() => reset()} />
          <ReplayPanel replayJson={replayJson} replayLink={replayLink} replayFrame={replayFrame} replayFrameMax={Math.max(0, replayFrames.length - 1)} onImport={loadReplay} onFrameChange={setReplayFrame} />
          <LeaderboardPanel scores={scores} onWatchReplay={loadReplay} onSubmitScore={submitScore} />
        </aside>
      </div>

      <MobileDrawer open={drawerOpen} title="Game Settings" onClose={() => setDrawerOpen(false)}>
        <div data-mobile-drawer-scroll="true" className="space-y-3">
          <SettingsPanel
            theme={theme}
            difficulty={difficulty}
            wrapAround={wrapAround}
            practiceMode={practiceMode}
            showDpad={showDpad}
            paused={paused}
            onThemeChange={setTheme}
            onDifficultyChange={setDifficulty}
            onWrapChange={setWrapAround}
            onPracticeModeChange={setPracticeMode}
            onShowDpadChange={setShowDpad}
            onPauseToggle={() => setPaused((p) => !p)}
            onRestart={() => reset()}
          />
          <div className="rounded-2xl border border-white/15 bg-black/25 p-3">
            <label className="flex items-center justify-between gap-2 text-sm">
              <span>Haptic feedback</span>
              <input type="checkbox" checked={hapticsEnabled} onChange={(e) => setHapticsEnabled(e.target.checked)} aria-label="Toggle haptic feedback" />
            </label>
          </div>
          <ReplayPanel replayJson={replayJson} replayLink={replayLink} replayFrame={replayFrame} replayFrameMax={Math.max(0, replayFrames.length - 1)} onImport={loadReplay} onFrameChange={setReplayFrame} />
          <LeaderboardPanel scores={scores} onWatchReplay={loadReplay} onSubmitScore={submitScore} />
        </div>
      </MobileDrawer>

      <Toast message={toast} />

      <footer className="fixed inset-x-0 bottom-0 z-50 w-full max-w-full border-t border-white/10 bg-slate-950/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <div className="mx-auto mb-2 flex w-full max-w-md items-center justify-between text-xs text-slate-300/85">
          <span>Thumb controls</span>
          <button className="rounded border border-white/20 px-2 py-1" onClick={() => setDrawerOpen(true)}>Game Settings</button>
        </div>
        <div className="mx-auto w-full max-w-md">
          <MobileControls
            onInput={input}
            onPauseToggle={() => {
              setRunning(true);
              setPaused((p) => !p);
            }}
            onRestart={() => reset()}
            paused={paused}
            visible={showDpad}
            hapticsEnabled={hapticsEnabled}
            reduceMotion={reduceMotion}
          />
        </div>
      </footer>
    </main>
  );
}

function draw(canvas: HTMLCanvasElement | null, state: ReturnType<typeof createInitialState>, theme: ThemeMode, tile: number) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (theme === 'modern') {
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, '#020617');
    g.addColorStop(1, '#1e293b');
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = '#101314';
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (theme === 'retro') {
    ctx.strokeStyle = 'rgba(138,255,113,.08)';
    for (let x = 0; x <= canvas.width; x += tile) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y <= canvas.height; y += tile) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
  }

  state.snake.forEach((part, i) => {
    ctx.fillStyle = theme === 'modern' ? `rgba(56,189,248,${Math.max(0.3, 1 - i * 0.03)})` : '#8af27a';
    if (theme === 'modern') { ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 10; }
    ctx.fillRect(part.x * tile + 2, part.y * tile + 2, tile - 4, tile - 4);
    ctx.shadowBlur = 0;
  });

  ctx.fillStyle = theme === 'modern' ? '#fb923c' : '#facc15';
  ctx.beginPath();
  ctx.arc(state.food.x * tile + tile / 2, state.food.y * tile + tile / 2, tile * 0.32, 0, Math.PI * 2);
  ctx.fill();
}
