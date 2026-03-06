import { ThemeMode } from '@/lib/game/types';

export const THEME_OPTIONS: { value: ThemeMode; label: string; subtitle: string; swatch: string }[] = [
  { value: 'modern', label: 'Modern', subtitle: 'Neon glass + futuristic HUD', swatch: 'from-cyan-400 via-blue-500 to-indigo-600' },
  { value: 'retro', label: 'Retro', subtitle: 'Arcade CRT + pixel attitude', swatch: 'from-lime-300 via-emerald-500 to-yellow-400' },
  { value: 'masters', label: 'Masters Build', subtitle: 'Minimal editorial premium', swatch: 'from-slate-100 via-zinc-300 to-slate-400' },
  { value: 'threed', label: '3D', subtitle: 'Depth shaded pseudo-3D board', swatch: 'from-fuchsia-400 via-violet-500 to-sky-500' }
];

export const THEME_TITLES: Record<ThemeMode, string> = {
  modern: 'Modern Snake',
  retro: 'Retro Snake',
  masters: 'Masters Build Snake',
  threed: '3D Snake'
};

export const THEME_SURFACES: Record<ThemeMode, {
  page: string;
  panel: string;
  softPanel: string;
  textMuted: string;
  buttonPrimary: string;
  buttonDanger: string;
  buttonGhost: string;
  badge: string;
  drawer: string;
  footer: string;
  canvasFrame: string;
  keyHint: string;
  overlay: string;
}> = {
  modern: {
    page: 'theme-modern modern-bg',
    panel: 'border-cyan-200/25 bg-slate-950/50 shadow-[0_10px_30px_rgba(6,182,212,0.12)] backdrop-blur-xl',
    softPanel: 'border-white/15 bg-slate-950/45',
    textMuted: 'text-cyan-100/75',
    buttonPrimary: 'border-cyan-300/35 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_6px_20px_rgba(6,182,212,0.4)]',
    buttonDanger: 'border-rose-200/35 bg-gradient-to-r from-rose-500 to-orange-500 text-white',
    buttonGhost: 'border-cyan-100/25 bg-cyan-950/40 text-cyan-100',
    badge: 'border-cyan-300/35 bg-cyan-400/15 text-cyan-100',
    drawer: 'border-cyan-200/20 bg-slate-950/96',
    footer: 'border-cyan-200/20 bg-slate-950/90 backdrop-blur-xl',
    canvasFrame: 'border-cyan-200/35 bg-slate-950/70 shadow-[0_20px_40px_rgba(8,145,178,0.2)]',
    keyHint: 'border-cyan-300/20 bg-slate-900/55 text-cyan-50/75',
    overlay: 'bg-slate-950/60'
  },
  retro: {
    page: 'theme-retro retro-font retro-scanlines',
    panel: 'border-lime-300/40 bg-[#0c100d]/80 shadow-[0_0_0_2px_rgba(163,230,53,0.18)]',
    softPanel: 'border-lime-300/25 bg-[#0a0e0b]/80',
    textMuted: 'text-lime-100/70',
    buttonPrimary: 'border-lime-300/65 bg-lime-500/35 text-lime-50',
    buttonDanger: 'border-amber-300/60 bg-amber-500/35 text-amber-50',
    buttonGhost: 'border-lime-300/40 bg-lime-950/45 text-lime-100',
    badge: 'border-yellow-200/45 bg-yellow-500/20 text-yellow-100',
    drawer: 'border-lime-300/35 bg-[#070a07]/95',
    footer: 'border-lime-300/30 bg-[#070a07]/94 backdrop-blur',
    canvasFrame: 'border-lime-300/45 bg-[#070a07] shadow-[0_0_0_2px_rgba(163,230,53,0.16)]',
    keyHint: 'border-lime-300/30 bg-[#0f140f]/85 text-lime-100/80',
    overlay: 'bg-[#050705]/68'
  },
  masters: {
    page: 'theme-masters',
    panel: 'border-white/20 bg-zinc-900/55 shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur-lg',
    softPanel: 'border-white/12 bg-zinc-900/45',
    textMuted: 'text-zinc-300/75',
    buttonPrimary: 'border-zinc-100/25 bg-zinc-100 text-zinc-950',
    buttonDanger: 'border-zinc-200/20 bg-zinc-700 text-zinc-100',
    buttonGhost: 'border-zinc-100/20 bg-zinc-900/60 text-zinc-100',
    badge: 'border-white/25 bg-white/10 text-zinc-100',
    drawer: 'border-white/20 bg-zinc-950/96',
    footer: 'border-white/15 bg-zinc-950/88 backdrop-blur-xl',
    canvasFrame: 'border-white/20 bg-zinc-950/75 shadow-[0_18px_40px_rgba(0,0,0,0.35)]',
    keyHint: 'border-white/15 bg-zinc-900/60 text-zinc-200/75',
    overlay: 'bg-zinc-950/62'
  },
  threed: {
    page: 'theme-3d',
    panel: 'border-violet-200/25 bg-slate-950/52 shadow-[0_14px_35px_rgba(124,58,237,0.22)] backdrop-blur-xl',
    softPanel: 'border-violet-200/15 bg-slate-950/45',
    textMuted: 'text-violet-100/75',
    buttonPrimary: 'border-violet-300/35 bg-gradient-to-r from-violet-500 to-sky-500 text-white',
    buttonDanger: 'border-fuchsia-200/30 bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white',
    buttonGhost: 'border-violet-100/20 bg-violet-950/45 text-violet-100',
    badge: 'border-sky-300/30 bg-sky-400/15 text-sky-100',
    drawer: 'border-violet-200/20 bg-slate-950/96',
    footer: 'border-violet-200/20 bg-slate-950/90 backdrop-blur-xl',
    canvasFrame: 'border-violet-200/30 bg-slate-950/70 shadow-[0_18px_40px_rgba(109,40,217,0.25)]',
    keyHint: 'border-violet-200/20 bg-slate-900/60 text-violet-100/80',
    overlay: 'bg-slate-950/58'
  }
};

export function themeLabel(value: ThemeMode) {
  return THEME_OPTIONS.find((option) => option.value === value)?.label ?? 'Theme';
}
