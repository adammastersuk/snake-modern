import { Difficulty, ThemeMode } from '@/lib/game/types';

interface Props {
  theme: ThemeMode;
  difficulty: Difficulty;
  wrapAround: boolean;
  practiceMode: boolean;
  showDpad: boolean;
  paused: boolean;
  onThemeChange: (v: ThemeMode) => void;
  onDifficultyChange: (v: Difficulty) => void;
  onWrapChange: (v: boolean) => void;
  onPracticeModeChange: (v: boolean) => void;
  onShowDpadChange: (v: boolean) => void;
  onPauseToggle: () => void;
  onRestart: () => void;
}

export function SettingsPanel(p: Props) {
  return (
    <aside className="space-y-3 rounded-2xl border border-white/15 bg-black/25 p-4">
      <h2 className="font-semibold">Settings</h2>

      <OptionGroup
        label="Theme"
        value={p.theme}
        options={[
          { value: 'modern', label: 'Modern' },
          { value: 'retro', label: 'Retro' }
        ]}
        onChange={(value) => p.onThemeChange(value as ThemeMode)}
      />

      <OptionGroup
        label="Difficulty"
        value={p.difficulty}
        options={[
          { value: 'casual', label: 'Casual' },
          { value: 'classic', label: 'Classic' },
          { value: 'hardcore', label: 'Hardcore' }
        ]}
        onChange={(value) => p.onDifficultyChange(value as Difficulty)}
      />

      <Toggle label="Wrap-around" checked={p.wrapAround} onChange={p.onWrapChange} />
      <Toggle label="Practice mode" checked={p.practiceMode} onChange={p.onPracticeModeChange} />
      <Toggle label="On-screen D-pad" checked={p.showDpad} onChange={p.onShowDpadChange} />

      <div className="grid grid-cols-2 gap-2">
        <button onClick={p.onPauseToggle} className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold">
          {p.paused ? 'Resume' : 'Pause'}
        </button>
        <button onClick={p.onRestart} className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold">
          Restart
        </button>
      </div>
    </aside>
  );
}

function OptionGroup({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm">{label}</legend>
      <div className="grid gap-2" role="radiogroup" aria-label={label} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={`min-h-11 rounded-lg border px-2 py-1 text-sm transition ${
                active ? 'border-cyan-300/70 bg-cyan-500/30 text-white' : 'border-white/20 bg-white/10 text-slate-100'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
