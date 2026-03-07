'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HUD } from '@/components/HUD';
import { KeyHints } from '@/components/KeyHints';
import { LeaderboardPanel } from '@/components/LeaderboardPanel';
import { MobileControls } from '@/components/MobileControls';
import { MobileDrawer } from '@/components/MobileDrawer';
import { SettingsPanel } from '@/components/SettingsPanel';
import { StartOverlay } from '@/components/StartOverlay';
import { Toast } from '@/components/Toast';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { buildGameConfig } from '@/lib/game/difficulty';
import { createFinalRunSnapshot, FinalRunSnapshot, resolveSubmittedScore } from '@/lib/game/finalRun';
import { createSeed, SeededRng } from '@/lib/game/rng';
import { isTypingTarget } from '@/lib/game/keyboard';
import { createInitialState, enqueueDirection, stepGame } from '@/lib/game/simulation';
import { Difficulty, Direction, ScoreEntry, ThemeMode } from '@/lib/game/types';
import { THEME_SURFACES, THEME_TITLES } from '@/lib/theme';
import { LEADERBOARD_SCORES_API_PATH } from '@/lib/api-paths';

const DEFAULT_TILE = 22;
const MAX_PLAYER_NAME_LENGTH = 20;

interface SubmitFeedback {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message: string;
}

interface SubmissionResult {
  name: string;
  score: number;
  rank: number | null;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [theme, setTheme] = useState<ThemeMode>('modern');
  const [difficulty, setDifficulty] = useState<Difficulty>('classic');
  const [wrapAround, setWrapAround] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [showDpad, setShowDpad] = useState(true);
  const [paused, setPaused] = useState(true);
  const [toast, setToast] = useState('');
  const [submitFeedback, setSubmitFeedback] = useState<SubmitFeedback>({ status: 'idle', message: '' });
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState(0);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileFooterHeight, setMobileFooterHeight] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [canvasFocused, setCanvasFocused] = useState(false);
  const [showMobileHint, setShowMobileHint] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [finalRun, setFinalRun] = useState<FinalRunSnapshot | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const pausedBeforeDrawer = useRef(true);
  const reduceMotion = usePrefersReducedMotion();
  const mobileFooterRef = useRef<HTMLElement>(null);
  const boardRegionRef = useRef<HTMLDivElement>(null);

  const config = useMemo(() => buildGameConfig(difficulty, practiceMode, wrapAround), [difficulty, practiceMode, wrapAround]);
  const [uiState, setUiState] = useState(() => createInitialState(createSeed(), config));
  const [canvasMetrics, setCanvasMetrics] = useState({ tile: DEFAULT_TILE, cssWidth: config.width * DEFAULT_TILE, cssHeight: config.height * DEFAULT_TILE, dpr: 1 });
  const stateRef = useRef(uiState);
  const queueRef = useRef<Direction[]>([]);
  const rngRef = useRef(new SeededRng(uiState.seed));
  const surface = THEME_SURFACES[theme];


  const refreshScores = useCallback(async () => {
    const response = await fetch(LEADERBOARD_SCORES_API_PATH, {
      headers: { Accept: 'application/json' }
    });

    const list = await response.json().catch(() => null);
    if (!response.ok) {
      const message = list?.error ?? `Failed to load leaderboard (${response.status})`;
      throw new Error(message);
    }

    setScores(Array.isArray(list?.scores) ? list.scores : []);
  }, []);

  const restartGame = useCallback((seed = createSeed()) => {
    const next = createInitialState(seed, config);
    stateRef.current = next;
    rngRef.current = new SeededRng(next.seed);
    queueRef.current = [];
    setPaused(true);
    setRunning(false);
    setUiState({ ...next, snake: [...next.snake] });
    setSubmitFeedback({ status: 'idle', message: '' });
    setFinalRun(null);
    setSubmissionResult(null);
    setPlayerName('');
  }, [config]);

  useEffect(() => restartGame(), [config, restartGame]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    setBest(Number(localStorage.getItem('snake-best') ?? '0'));
    refreshScores().catch((error) => {
      const message = error instanceof Error ? error.message : 'Failed to load leaderboard scores.';
      console.error('[leaderboard] Initial leaderboard refresh failed.', { message });
      setSubmitFeedback({ status: 'error', message });
      setToast('Leaderboard unavailable');
    });
    setShowMobileHint(localStorage.getItem('snake-mobile-hint-dismissed') !== '1');
    setHapticsEnabled(localStorage.getItem('snake-haptics') === '1');
  }, [refreshScores]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => localStorage.setItem('snake-haptics', hapticsEnabled ? '1' : '0'), [hapticsEnabled]);
  const input = useCallback((dir: Direction) => {
    enqueueDirection(queueRef.current, stateRef.current, dir);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target as HTMLElement | null)) return;

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
        input(dir);
      }
      if (e.key === ' ') {
        e.preventDefault();
        setRunning(true);
        setPaused((p) => !p);
      }
      if (e.key.toLowerCase() === 'r') restartGame();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [input, restartGame]);

  const endGame = useCallback(() => {
    const finalState = stateRef.current;
    const snapshot = createFinalRunSnapshot(finalState, {
      difficulty,
      mode: theme,
      wrapAround,
      practiceMode
    });

    setFinalRun(snapshot);
    setPaused(true);
    setRunning(false);
  }, [difficulty, practiceMode, theme, wrapAround]);

  useEffect(() => {
    const target = canvasRef.current;
    if (!target) return;
    let startX = 0;
    let startY = 0;
    const touchStart = (e: TouchEvent) => { e.preventDefault(); startX = e.touches[0].clientX; startY = e.touches[0].clientY; setCanvasFocused(true); };
    const touchMove = (e: TouchEvent) => e.preventDefault();
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
      const viewportWidth = Math.floor(window.visualViewport?.width ?? window.innerWidth);
      const viewportHeight = Math.floor(window.visualViewport?.height ?? window.innerHeight);
      const widthLimit = Math.max(320, viewportWidth) - (isMobile ? 20 : 32);
      const fallbackFooter = showDpad ? 196 : 96;
      const measuredFooter = mobileFooterHeight > 0 ? mobileFooterHeight : fallbackFooter;
      const boardTop = boardRegionRef.current?.getBoundingClientRect().top ?? 0;
      const footerTop = mobileFooterRef.current?.getBoundingClientRect().top ?? (viewportHeight - measuredFooter);
      const measuredBoardSpace = Math.floor(footerTop - boardTop - 12);
      const mobileHeightLimit = Number.isFinite(measuredBoardSpace) && measuredBoardSpace > 0
        ? measuredBoardSpace
        : viewportHeight - (measuredFooter + 132);
      const heightLimit = isMobile ? Math.max(180, mobileHeightLimit) : Math.max(360, viewportHeight - 260);
      const tileByWidth = Math.floor(widthLimit / config.width);
      const tileByHeight = Math.floor(heightLimit / config.height);
      const nextTile = Math.max(12, Math.min(DEFAULT_TILE, tileByWidth, tileByHeight));
      setCanvasMetrics({ tile: nextTile, cssWidth: nextTile * config.width, cssHeight: nextTile * config.height, dpr });
    };
    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, [config.height, config.width, isMobile, mobileFooterHeight, showDpad]);

  useEffect(() => {
    if (!isMobile) {
      setMobileFooterHeight(0);
      return;
    }

    const node = mobileFooterRef.current;
    if (!node) return;

    const updateHeight = () => {
      const next = Math.ceil(node.getBoundingClientRect().height);
      setMobileFooterHeight((prev) => (prev === next ? prev : next));
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    window.visualViewport?.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
      window.visualViewport?.removeEventListener('resize', updateHeight);
    };
  }, [isMobile, showDpad]);

  const mobileFooterReserve = isMobile ? (mobileFooterHeight || (showDpad ? 196 : 96)) + 12 : 0;

  const anyMobileDrawerOpen = drawerOpen || leaderboardOpen;
  const mobilePlayMode = isMobile && !anyMobileDrawerOpen && (running || canvasFocused);

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
    return () => { body.style.overflow = ''; html.style.overflow = ''; body.style.touchAction = ''; };
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
    if (anyMobileDrawerOpen) { pausedBeforeDrawer.current = paused; setPaused(true); return; }
    setPaused(pausedBeforeDrawer.current);
    // Intentionally only react to drawer/isMobile transitions.
    // Including `paused` here forces the game back to the previous value
    // after every pause toggle and can make Start appear non-functional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyMobileDrawerOpen, isMobile]);

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
          if (!paused && running) {
            stepGame(stateRef.current, config, queueRef.current, rngRef.current);
            if (!stateRef.current.alive) {
              endGame();
            }
        }
        accumulator -= frameMs;
      }
      draw(canvasRef.current, stateRef.current, theme, canvasMetrics.tile * canvasMetrics.dpr);
      setUiState({ ...stateRef.current, snake: [...stateRef.current.snake] });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [config, paused, running, theme, canvasMetrics, endGame]);

  useEffect(() => {
    if (!uiState.alive && uiState.score > best) {
      setBest(uiState.score);
      localStorage.setItem('snake-best', String(uiState.score));
    }
  }, [uiState.alive, uiState.score, best]);

  const submitScore = async () => {
    const candidate = finalRun;
    if (!candidate || candidate.score <= 0) {
      const message = 'Finish a run first (run must end with a score).';
      setSubmitFeedback({ status: 'error', message });
      setToast('Finish a run first');
      return;
    }

    const trimmedName = playerName.trim();
    if (!trimmedName) {
      const message = 'Enter a display name before submitting.';
      setSubmitFeedback({ status: 'error', message });
      return;
    }

    if (trimmedName.length > MAX_PLAYER_NAME_LENGTH) {
      const message = `Name must be ${MAX_PLAYER_NAME_LENGTH} characters or fewer.`;
      setSubmitFeedback({ status: 'error', message });
      return;
    }

    setSubmitFeedback({ status: 'submitting', message: 'Submitting score…' });
    setSubmissionResult(null);

    const payload = {
      name: trimmedName,
      score: candidate.score,
      length: candidate.length,
      difficulty: candidate.difficulty,
      mode: candidate.mode,
      wrapAround: candidate.wrapAround,
      practiceMode: candidate.practiceMode
    };

    const res = await fetch(LEADERBOARD_SCORES_API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const message = data?.error ?? `Score submission failed (${res.status})`;
      console.error('[leaderboard] Score submission failed.', { status: res.status, message, payload });
      setSubmitFeedback({ status: 'error', message });
      setToast('Score submit failed');
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (Array.isArray(data.scores)) {
      setScores(data.scores);
    } else {
      await refreshScores().catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to refresh leaderboard after submission.';
        console.error('[leaderboard] Failed to refresh leaderboard after submission.', { message });
      });
    }

    let persistedScore = candidate.score;
    try {
      persistedScore = resolveSubmittedScore(candidate, data.score);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Submitted score did not match final run score.';
      setSubmitFeedback({ status: 'error', message });
      setToast('Score mismatch');
      await refreshScores().catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to refresh leaderboard after submission mismatch.';
        console.error('[leaderboard] Failed to refresh leaderboard after mismatch.', { message });
      });
      return;
    }

    const rank = typeof data.rank === 'number' ? data.rank : null;
    const rankText = rank ? ` • Rank #${rank}` : '';
    const success = `Score submitted (${persistedScore})${rankText}`;
    setSubmissionResult({ name: trimmedName, score: persistedScore, rank });
    setSubmitFeedback({ status: 'success', message: success });
    setToast('Score submitted');
  };

  return (
    <main className={`mx-auto max-w-7xl overflow-x-hidden px-3 pt-3 md:p-4 ${surface.page}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="min-w-0 text-2xl font-bold sm:text-3xl">{THEME_TITLES[theme]}</h1>
        <a
          href="https://builds.adammasters.co.uk"
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium sm:text-sm ${surface.buttonGhost}`}
        >
          Back to Builds
        </a>
      </div>
      <div className="grid max-w-full gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <div className="mb-2 flex items-start gap-2 lg:hidden">
            <div className="min-w-0 flex-1">
              <HUD score={uiState.score} best={best} speed={uiState.speed} length={uiState.snake.length} theme={theme} />
            </div>
            <div className="w-32 shrink-0 space-y-2">
              <button className={`min-h-11 w-full rounded-xl border px-3 py-2 text-sm font-medium ${surface.buttonGhost}`} onClick={() => setDrawerOpen(true)}>Game Settings</button>
              <button className={`min-h-11 w-full rounded-xl border px-3 py-2 text-sm font-medium ${surface.buttonGhost}`} onClick={() => setLeaderboardOpen(true)}>Leaderboard</button>
            </div>
          </div>
          <div className="mb-2 hidden lg:block">
            <HUD score={uiState.score} best={best} speed={uiState.speed} length={uiState.snake.length} theme={theme} />
          </div>
          {showMobileHint && isMobile && (
            <div className={`mb-2 flex items-start justify-between gap-2 rounded-xl border p-2 text-xs ${surface.softPanel}`}>
              <p>Tip: Controls are pinned at the bottom. Swipe the board to steer, use Game Settings to tune your run, and tap Leaderboard to open top runs.</p>
              <button type="button" className={`rounded border px-2 py-1 ${surface.buttonGhost}`} onClick={() => { setShowMobileHint(false); localStorage.setItem('snake-mobile-hint-dismissed', '1'); }}>Dismiss</button>
            </div>
          )}
          <div ref={boardRegionRef} className="relative mt-2 max-w-full touch-none select-none overscroll-none" onPointerDown={() => setCanvasFocused(true)}>
            <StartOverlay
              running={running}
              alive={uiState.alive}
              score={finalRun?.score ?? uiState.score}
              submitFeedback={submitFeedback}
              playerName={playerName}
              maxNameLength={MAX_PLAYER_NAME_LENGTH}
              submissionResult={submissionResult}
              onPlayerNameChange={(value) => {
                setPlayerName(value.slice(0, MAX_PLAYER_NAME_LENGTH));
                if (submitFeedback.status === 'error') {
                  setSubmitFeedback({ status: 'idle', message: '' });
                }
              }}
              onStart={() => {
                if (uiState.alive) {
                  setRunning(true);
                  setPaused(false);
                  return;
                }
                restartGame();
                setRunning(true);
                setPaused(false);
              }}
              onSubmitScore={submitScore}
              theme={theme}
            />
            <div className={`mx-auto w-full max-w-full overflow-hidden rounded-2xl border ${surface.canvasFrame}`}>
              <canvas
                ref={canvasRef}
                width={Math.floor(canvasMetrics.cssWidth * canvasMetrics.dpr)}
                height={Math.floor(canvasMetrics.cssHeight * canvasMetrics.dpr)}
                className="game-touch-area block max-w-full"
                style={{ width: `${canvasMetrics.cssWidth}px`, height: `${canvasMetrics.cssHeight}px`, marginInline: 'auto' }}
                onFocus={() => setCanvasFocused(true)}
                onBlur={() => setCanvasFocused(false)}
                tabIndex={0}
                aria-label="Snake game board"
              />
            </div>
          </div>
          <div className="mt-2 hidden md:block"><KeyHints theme={theme} /></div>
        </section>
        <aside className="hidden space-y-3 lg:sticky lg:top-4 lg:block lg:h-fit">
          <SettingsPanel theme={theme} difficulty={difficulty} wrapAround={wrapAround} practiceMode={practiceMode} showDpad={showDpad} paused={paused} onThemeChange={setTheme} onDifficultyChange={setDifficulty} onWrapChange={setWrapAround} onPracticeModeChange={setPracticeMode} onShowDpadChange={setShowDpad} onPauseToggle={() => setPaused((p) => !p)} onRestart={() => restartGame()} />
          <LeaderboardPanel scores={scores} theme={theme} />
        </aside>
      </div>

      <MobileDrawer open={drawerOpen} title="Game Settings" onClose={() => setDrawerOpen(false)} theme={theme}>
        <div data-mobile-drawer-scroll="true" className="space-y-3">
          <SettingsPanel theme={theme} difficulty={difficulty} wrapAround={wrapAround} practiceMode={practiceMode} showDpad={showDpad} paused={paused} onThemeChange={setTheme} onDifficultyChange={setDifficulty} onWrapChange={setWrapAround} onPracticeModeChange={setPracticeMode} onShowDpadChange={setShowDpad} onPauseToggle={() => setPaused((p) => !p)} onRestart={() => restartGame()} />
          <div className={`rounded-2xl border p-3 ${surface.panel}`}>
            <label className="flex items-center justify-between gap-2 text-sm"><span>Haptic feedback</span><input type="checkbox" checked={hapticsEnabled} onChange={(e) => setHapticsEnabled(e.target.checked)} aria-label="Toggle haptic feedback" /></label>
          </div>
        </div>
      </MobileDrawer>

      <MobileDrawer open={leaderboardOpen} title="Leaderboard" onClose={() => setLeaderboardOpen(false)} theme={theme}>
        <div data-mobile-drawer-scroll="true" className="space-y-3">
          <LeaderboardPanel scores={scores} theme={theme} />
        </div>
      </MobileDrawer>


      {isMobile && <div aria-hidden="true" className="md:hidden" style={{ height: `${mobileFooterReserve}px` }} />}

      <Toast message={toast} theme={theme} />

      <footer ref={mobileFooterRef} className={`fixed inset-x-0 bottom-0 z-50 w-full max-w-full border-t px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 md:hidden ${surface.footer}`}>
        <div className="mx-auto w-full max-w-md">
          <MobileControls onInput={input} onPauseToggle={() => { setRunning(true); setPaused((p) => !p); }} onRestart={() => restartGame()} paused={paused} visible={showDpad} hapticsEnabled={hapticsEnabled} reduceMotion={reduceMotion} theme={theme} />
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
    g.addColorStop(0, '#020617'); g.addColorStop(1, '#1e293b');
    ctx.fillStyle = g;
  } else if (theme === 'retro') {
    ctx.fillStyle = '#0b120d';
  } else if (theme === 'masters') {
    ctx.fillStyle = '#090909';
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#111827'); g.addColorStop(1, '#0b1120');
    ctx.fillStyle = g;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x <= canvas.width; x += tile) {
    for (let y = 0; y <= canvas.height; y += tile) {
      if (theme === 'retro') {
        ctx.strokeStyle = 'rgba(163,230,53,0.09)';
        ctx.strokeRect(x, y, tile, tile);
      } else if (theme === 'masters') {
        ctx.strokeStyle = 'rgba(244,244,245,0.05)';
        ctx.strokeRect(x, y, tile, tile);
      } else if (theme === 'threed') {
        ctx.fillStyle = (x / tile + y / tile) % 2 === 0 ? 'rgba(91,33,182,0.15)' : 'rgba(56,189,248,0.08)';
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }

  state.snake.forEach((part, i) => {
    const x = part.x * tile;
    const y = part.y * tile;
    if (theme === 'retro') {
      ctx.fillStyle = i === 0 ? '#bef264' : '#84cc16';
      ctx.fillRect(x + 1, y + 1, tile - 2, tile - 2);
      ctx.strokeStyle = 'rgba(10,10,10,0.6)';
      ctx.strokeRect(x + 1, y + 1, tile - 2, tile - 2);
      return;
    }

    if (theme === 'masters') {
      const alpha = Math.max(0.3, 1 - i * 0.03);
      ctx.fillStyle = `rgba(245,245,245,${alpha})`;
      ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
      return;
    }

    if (theme === 'threed') {
      ctx.fillStyle = i === 0 ? '#22d3ee' : '#8b5cf6';
      ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 2);
      ctx.lineTo(x + tile - 2, y + 2);
      ctx.lineTo(x + tile - 5, y + 6);
      ctx.lineTo(x + 5, y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.moveTo(x + tile - 2, y + 2);
      ctx.lineTo(x + tile - 2, y + tile - 2);
      ctx.lineTo(x + tile - 5, y + tile - 5);
      ctx.lineTo(x + tile - 5, y + 6);
      ctx.closePath();
      ctx.fill();
      return;
    }

    ctx.fillStyle = `rgba(56,189,248,${Math.max(0.3, 1 - i * 0.03)})`;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 10;
    ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
    ctx.shadowBlur = 0;
  });

  const fx = state.food.x * tile + tile / 2;
  const fy = state.food.y * tile + tile / 2;
  if (theme === 'retro') {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(fx - tile * 0.25, fy - tile * 0.25, tile * 0.5, tile * 0.5);
  } else if (theme === 'masters') {
    ctx.fillStyle = '#fafafa';
    ctx.beginPath();
    ctx.arc(fx, fy, tile * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (theme === 'threed') {
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.arc(fx, fy, tile * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(fx - tile * 0.08, fy - tile * 0.08, tile * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.arc(fx, fy, tile * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }
}
