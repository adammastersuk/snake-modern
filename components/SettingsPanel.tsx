import { Difficulty, ThemeMode } from '@/lib/game/types';
import { THEME_OPTIONS, THEME_SURFACES } from '@/lib/theme';

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
  const surface = THEME_SURFACES[p.theme];
  return (
    <aside className={`space-y-3 rounded-2xl border p-4 ${surface.panel}`}>
      <h2 className="font-semibold">Settings</h2>

      <fieldset>
        <legend className="mb-2 text-sm">Theme</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {THEME_OPTIONS.map((option) => {
            const active = option.value === p.theme;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => p.onThemeChange(option.value)}
                className={`rounded-xl border p-2.5 text-left transition ${active ? surface.badge : surface.softPanel}`}
              >
                <div className={`mb-1 h-5 rounded-md bg-gradient-to-r ${option.swatch}`} />
                <p className="text-sm font-semibold">{option.label}</p>
                <p className={`text-xs ${surface.textMuted}`}>{option.subtitle}</p>
              </button>
            );
          })}
        </div>
      </fieldset>

      <OptionGroup
        label="Difficulty"
        value={p.difficulty}
        options={[
          { value: 'casual', label: 'Casual' },
          { value: 'classic', label: 'Classic' },
          { value: 'hardcore', label: 'Hardcore' }
        ]}
        activeClass={surface.badge}
        idleClass={surface.softPanel}
        onChange={(value) => p.onDifficultyChange(value as Difficulty)}
      />

      <Toggle label="Wrap-around" checked={p.wrapAround} onChange={p.onWrapChange} mutedClass={surface.textMuted} />
      <Toggle label="Practice mode" checked={p.practiceMode} onChange={p.onPracticeModeChange} mutedClass={surface.textMuted} />
      <Toggle label="On-screen D-pad" checked={p.showDpad} onChange={p.onShowDpadChange} mutedClass={surface.textMuted} />

      <div className="grid grid-cols-2 gap-2">
        <button onClick={p.onPauseToggle} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${surface.buttonPrimary}`}>
          {p.paused ? 'Resume' : 'Pause'}
        </button>
        <button onClick={p.onRestart} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${surface.buttonDanger}`}>
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
  onChange,
  activeClass,
  idleClass
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  activeClass: string;
  idleClass: string;
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
              className={`min-h-11 rounded-lg border px-2 py-1 text-sm transition ${active ? activeClass : idleClass}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Toggle({ label, checked, onChange, mutedClass }: { label: string; checked: boolean; onChange: (v: boolean) => void; mutedClass: string }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      <span className={mutedClass}>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
