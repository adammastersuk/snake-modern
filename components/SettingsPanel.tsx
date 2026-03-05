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
      <Select label="Theme" value={p.theme} onChange={(v) => p.onThemeChange(v as ThemeMode)} options={['modern', 'retro']} />
      <Select label="Difficulty" value={p.difficulty} onChange={(v) => p.onDifficultyChange(v as Difficulty)} options={['casual', 'classic', 'hardcore']} />
      <Toggle label="Wrap-around" checked={p.wrapAround} onChange={p.onWrapChange} />
      <Toggle label="Practice mode" checked={p.practiceMode} onChange={p.onPracticeModeChange} />
      <Toggle label="On-screen D-pad" checked={p.showDpad} onChange={p.onShowDpadChange} />
      <div className="flex gap-2">
        <button onClick={p.onPauseToggle} className="rounded bg-indigo-500 px-3 py-2">{p.paused ? 'Resume' : 'Pause'}</button>
        <button onClick={p.onRestart} className="rounded bg-rose-500 px-3 py-2">Restart</button>
      </div>
    </aside>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return <label className="block text-sm"><span className="mb-1 block">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded bg-black/35 p-2">{options.map((o) => <option key={o}>{o}</option>)}</select></label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}
