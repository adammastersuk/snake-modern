'use client';

import { ThemeMode } from '@/lib/game/types';

interface Props {
  theme: ThemeMode;
  wrapAround: boolean;
  paused: boolean;
  reducedMotion: boolean;
  debug: boolean;
  onThemeChange: (mode: ThemeMode) => void;
  onWrapChange: (value: boolean) => void;
  onPauseToggle: () => void;
  onRestart: () => void;
  onDebugToggle: () => void;
}

export function SettingsPanel(props: Props) {
  const { theme, wrapAround, paused, reducedMotion } = props;

  return (
    <aside className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
      <h2 className="mb-3 text-lg font-semibold">Settings</h2>
      <div className="space-y-3 text-sm">
        <label className="block">
          <span className="mb-1 block">Theme</span>
          <select
            aria-label="Theme mode"
            className="w-full rounded-md bg-black/30 px-3 py-2"
            value={theme}
            onChange={(e) => props.onThemeChange(e.target.value as ThemeMode)}
          >
            <option value="modern">Modern</option>
            <option value="retro">Retro</option>
          </select>
        </label>

        <ThemePreview theme={theme} />

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={wrapAround} onChange={(e) => props.onWrapChange(e.target.checked)} />
          Wrap around walls
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={props.debug} onChange={props.onDebugToggle} />
          Debug overlay
        </label>

        <p className="text-xs text-white/70">Reduced motion: {reducedMotion ? 'on' : 'off'}</p>

        <div className="flex gap-2">
          <button className="rounded bg-indigo-500 px-3 py-2" onClick={props.onPauseToggle}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button className="rounded bg-rose-500 px-3 py-2" onClick={props.onRestart}>
            Restart
          </button>
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
