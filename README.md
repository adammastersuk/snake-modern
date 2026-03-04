# Snake Modern (Next.js + TypeScript)

A production-minded Snake game with a deterministic fixed-timestep simulation, instant Modern/Retro theming, replay export/import, mobile controls, and optional global leaderboard.

## Features

- **Modern / Retro theme toggle** (instant during gameplay)
- **Deterministic simulation** (fixed timestep + seeded RNG)
- **Input buffering** for responsive controls
- **Replay system**
  - export current run as JSON
  - import JSON and watch deterministic replay mode
- **Power-ups**: slow-time, score multiplier, ghost mode
- **Accessibility**
  - keyboard controls
  - semantic controls + aria labels
  - respects `prefers-reduced-motion`
- **Debug overlay**: FPS, sim steps/sec, snake length, current seed
- **Optional global leaderboard** (`/api/scores`) with replay verification and rate limiting
- **Always-on local high score** via `localStorage`

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Tests

```bash
npm run test
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import project in Vercel.
3. Add env vars (optional leaderboard):

### Environment variables

- `POSTGRES_URL` (optional)
  - If present, API stores/retrieves scores in Vercel Postgres.
  - If absent, API returns in-memory fallback for demo/dev.

> Recommended table:

```sql
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  name TEXT,
  score INTEGER NOT NULL,
  mode TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Replay format

Replay JSON stores:

- `seed`: initial seed
- `config`: game config snapshot (grid, speed, wrap setting)
- `events`: compact input events (`step`, `direction`)

Importing this JSON runs the same simulation deterministically.

## Controls

- Keyboard: Arrow keys / WASD
- Space: pause/resume
- R: restart
- Mobile: on-screen D-pad

## Notes

- Sound is intentionally omitted by default to keep UX clean and avoid unwanted autoplay behavior.
- Global leaderboard API endpoints:
  - `GET /api/scores?limit=10`
  - `POST /api/scores` with `{ name?, score, mode, replay }`
