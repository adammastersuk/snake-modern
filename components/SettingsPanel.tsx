'use client';

import { Difficulty, RetroPalette, ThemeMode } from '@/lib/game/types';

interface Props {
  theme: ThemeMode;
  wrapAround: boolean;
  paused: boolean;
  reducedMotion: boolean;
  debug: boolean;
  practiceMode: boolean;
  difficulty: Difficulty;
  retroPalette: RetroPalette;
  skipCountdown: boolean;
  showKeyHints: boolean;
  swipeEnabled: boolean;
  dpadEnabled: boolean;
  onThemeChange: (mode: ThemeMode) => void;
  onWrapChange: (value: boolean) => void;
  onPauseToggle: () => void;
  onRestart: () => void;
  onDebugToggle: () => void;
  onPracticeModeChange: (v: boolean) => void;
  onDifficultyChange: (d: Difficulty) => void;
  onPaletteChange: (p: RetroPalette) => void;
  onSkipCountdownChange: (v: boolean) => void;
  onShowKeyHintsChange: (v: boolean) => void;
  onSwipeChange: (v: boolean) => void;
  onDpadChange: (v: boolean) => void;
}

const check = 'flex items-center gap-2';

export function SettingsPanel(props: Props) {
  const { theme, wrapAround, paused, reducedMotion } = props;

  return (
    <aside className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
      <h2 className="mb-3 text-lg font-semibold">Settings</h2>
      <div className="space-y-3 text-sm max-h-[72vh] overflow-auto pr-1">
        <label className="block">
          <span className="mb-1 block">Difficulty</span>
          <select aria-label="Difficulty preset" className="w-full rounded-md bg-black/30 px-3 py-2" value={props.difficulty} onChange={(e) => props.onDifficultyChange(e.target.value as Difficulty)}>
            <option value="casual">Casual</option>
            <option value="classic">Classic</option>
            <option value="hardcore">Hardcore</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block">Theme</span>
          <select aria-label="Theme mode" className="w-full rounded-md bg-black/30 px-3 py-2" value={theme} onChange={(e) => props.onThemeChange(e.target.value as ThemeMode)}>
            <option value="modern">Modern</option>
            <option value="retro">Retro</option>
          </select>
        </label>

        {theme === 'retro' && (
          <label className="block">
            <span className="mb-1 block">Retro palette</span>
            <select aria-label="Retro palette" className="w-full rounded-md bg-black/30 px-3 py-2" value={props.retroPalette} onChange={(e) => props.onPaletteChange(e.target.value as RetroPalette)}>
              <option value="crt-green">CRT Green</option>
              <option value="amber">Amber</option>
              <option value="mono">Monochrome</option>
              <option value="gameboy">GameBoy</option>
            </select>
          </label>
        )}

        <ThemePreview theme={theme} />

        <label className={check}><input aria-label="Wrap around walls" type="checkbox" checked={wrapAround} onChange={(e) => props.onWrapChange(e.target.checked)} />Wrap around walls</label>
        <label className={check}><input aria-label="Practice mode" type="checkbox" checked={props.practiceMode} onChange={(e) => props.onPracticeModeChange(e.target.checked)} />Practice mode</label>
        <label className={check}><input aria-label="Skip countdown" type="checkbox" checked={props.skipCountdown} onChange={(e) => props.onSkipCountdownChange(e.target.checked)} />Skip countdown</label>
        <label className={check}><input aria-label="Show key hints" type="checkbox" checked={props.showKeyHints} onChange={(e) => props.onShowKeyHintsChange(e.target.checked)} />Show key hints</label>
        <label className={check}><input aria-label="Enable swipe controls" type="checkbox" checked={props.swipeEnabled} onChange={(e) => props.onSwipeChange(e.target.checked)} />Mobile swipe</label>
        <label className={check}><input aria-label="Enable D-pad controls" type="checkbox" checked={props.dpadEnabled} onChange={(e) => props.onDpadChange(e.target.checked)} />Mobile D-pad</label>
        <label className={check}><input aria-label="Debug overlay" type="checkbox" checked={props.debug} onChange={props.onDebugToggle} />Debug overlay</label>

        <p className="text-xs text-white/70">Reduced motion: {reducedMotion ? 'on' : 'off'}</p>

        <div className="flex gap-2">
          <button className="rounded bg-indigo-500 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" onClick={props.onPauseToggle} aria-label="Pause or resume game">{paused ? 'Resume' : 'Pause'}</button>
          <button className="rounded bg-rose-500 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" onClick={props.onRestart} aria-label="Restart run">Restart</button>
        </div>
      </div>
    </aside>
  );
}

function ThemePreview({ theme }: { theme: ThemeMode }) {
  return (
    <div className="rounded-lg border border-white/20 p-2" aria-label="Theme preview">
      <div className={`h-14 rounded ${theme === 'modern' ? 'bg-gradient-to-br from-cyan-400 to-indigo-700' : 'bg-[#1d2b53]'}`}>
        <div className={`h-full w-full ${theme === 'retro' ? 'bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.08)_3px)]' : ''}`} />
      </div>
    </div>
  );
}
