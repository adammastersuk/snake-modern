# Snake Modern (Next.js + TypeScript)

A production-minded Snake game with deterministic fixed-timestep simulation, instant Modern/Retro theming, replay export/import + share links, timeline scrubbing, and optional global leaderboard.

## Feature highlights

- **Board-first responsive layout** with sticky control column and panel collapse.
- **Modern / Retro themes** with retro palette selector and retro typography.
- **Start overlay + countdown**, optional skip countdown, pause/restart.
- **Difficulty presets**: Casual / Classic / Hardcore.
- **Practice mode** for lower pressure runs.
- **Deterministic engine**: fixed timestep + seeded RNG + input buffering.
- **Replay system**
  - export/import replay JSON
  - copy share link via compressed URL param (`?replay=...`)
  - replay timeline scrubber in replay mode
- **Leaderboard tabs**: Local (always) and Global (env-gated API).
- **Accessibility**: keyboard focus, ARIA labels, focus styles, reduced-motion support.
- **Debug overlay**: FPS, sim steps/sec, snake length, current seed

## Local development

```bash
npm install
npm run dev