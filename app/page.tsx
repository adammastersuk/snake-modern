'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HUD } from '@/components/HUD';
import { KeyHints } from '@/components/KeyHints';
import { LeaderboardPanel } from '@/components/LeaderboardPanel';
import { MobileControls } from '@/components/MobileControls';
import { ReplayPanel } from '@/components/ReplayPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { StartOverlay } from '@/components/StartOverlay';
import { Toast } from '@/components/Toast';
import { buildGameConfig } from '@/lib/game/difficulty';
import { compressReplay, exportReplay, importReplay } from '@/lib/game/replay';
import { createSeed, SeededRng } from '@/lib/game/rng';
import { buildReplay, buildReplayFrames, createInitialState, enqueueDirection, stepGame } from '@/lib/game/simulation';
import { Difficulty, Direction, InputEvent, ScoreEntry, ThemeMode } from '@/lib/game/types';

const TILE = 22;

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

  const config = useMemo(() => buildGameConfig(difficulty, practiceMode, wrapAround), [difficulty, practiceMode, wrapAround]);
  const [uiState, setUiState] = useState(() => createInitialState(createSeed(), config));
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
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 1600);
    return () => clearTimeout(t);
  }, [toast]);

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
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const touchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy)) input(dx > 0 ? 'right' : 'left');
      else input(dy > 0 ? 'down' : 'up');
    };
    target.addEventListener('touchstart', touchStart, { passive: true });
    target.addEventListener('touchend', touchEnd, { passive: true });
    return () => {
      target.removeEventListener('touchstart', touchStart);
      target.removeEventListener('touchend', touchEnd);
    };
  }, [input]);

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
        if (frame) draw(canvasRef.current, frame, theme);
      } else {
        draw(canvasRef.current, stateRef.current, theme);
      }

      setUiState({ ...stateRef.current, snake: [...stateRef.current.snake] });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [config, paused, running, replayFrames, replayFrame, theme]);

  useEffect(() => {
    if (!uiState.alive && uiState.score > best) {
      setBest(uiState.score);
      localStorage.setItem('snake-best', String(uiState.score));
    }
  }, [uiState.alive, uiState.score, best]);

  const loadReplay = (raw: string) => {
    try {
      const replay = importReplay(raw);
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
    <main className={`mx-auto max-w-7xl p-4 ${theme === 'modern' ? 'modern-bg' : 'retro-font retro-scanlines'}`}>
      <h1 className="mb-4 text-3xl font-bold">Modern Snake</h1>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <HUD score={uiState.score} best={best} speed={uiState.speed} length={uiState.snake.length} />
          <div className="relative mt-3 w-fit">
            <StartOverlay running={running} alive={uiState.alive} onStart={() => { setRunning(true); setPaused(false); }} />
            <canvas ref={canvasRef} width={config.width * TILE} height={config.height * TILE} className="rounded-2xl border border-white/20 bg-black/40" />
          </div>
          <div className="mt-2 space-y-2"><KeyHints /><MobileControls onInput={input} visible={showDpad} /></div>
        </section>
        <aside className="space-y-3 lg:sticky lg:top-4 lg:h-fit">
          <SettingsPanel theme={theme} difficulty={difficulty} wrapAround={wrapAround} practiceMode={practiceMode} showDpad={showDpad} paused={paused} onThemeChange={setTheme} onDifficultyChange={setDifficulty} onWrapChange={setWrapAround} onPracticeModeChange={setPracticeMode} onShowDpadChange={setShowDpad} onPauseToggle={() => setPaused((p) => !p)} onRestart={() => reset()} />
          <ReplayPanel replayJson={replayJson} replayLink={replayLink} replayFrame={replayFrame} replayFrameMax={Math.max(0, replayFrames.length - 1)} onImport={loadReplay} onFrameChange={setReplayFrame} />
          <LeaderboardPanel scores={scores} onWatchReplay={loadReplay} onSubmitScore={submitScore} />
        </aside>
      </div>
      <Toast message={toast} />
    </main>
  );
}

function draw(canvas: HTMLCanvasElement | null, state: ReturnType<typeof createInitialState>, theme: ThemeMode) {
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
    for (let x = 0; x <= canvas.width; x += TILE) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y <= canvas.height; y += TILE) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
  }

  state.snake.forEach((part, i) => {
    ctx.fillStyle = theme === 'modern' ? `rgba(56,189,248,${Math.max(0.3, 1 - i * 0.03)})` : '#8af27a';
    if (theme === 'modern') { ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 10; }
    ctx.fillRect(part.x * TILE + 2, part.y * TILE + 2, TILE - 4, TILE - 4);
    ctx.shadowBlur = 0;
  });

  ctx.fillStyle = theme === 'modern' ? '#fb923c' : '#facc15';
  ctx.beginPath();
  ctx.arc(state.food.x * TILE + TILE / 2, state.food.y * TILE + TILE / 2, TILE * 0.32, 0, Math.PI * 2);
  ctx.fill();
}
