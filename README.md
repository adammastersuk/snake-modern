# Snake Modern (Next.js + TypeScript)

A production-minded Snake game with deterministic fixed-timestep simulation, instant Modern/Retro theming, replay share links, timeline scrubber, and optional global leaderboard.

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

## Controls

- Keyboard: Arrow keys / WASD
- Space: start + pause/resume
- R: restart
- Esc: return to panels/settings area
- Mobile: swipe (default on) and optional D-pad

## Replay links

Replay share link uses compressed payload in URL:

- `?replay=<compressed-payload>`
- Opening a valid replay link auto-loads replay mode on page load.

## Leaderboard API + env vars

- `POSTGRES_URL` (optional)
  - If present, API stores/retrieves global scores in Vercel Postgres.
  - If absent, API uses in-memory fallback.

API routes:

- `GET /api/scores?limit=10`
- `POST /api/scores` with replay required payload:
  - `{ name?, score, mode, replay, difficulty, wrap, practice, theme, palette }`

> Recommended SQL schema:

```sql
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  name TEXT,
  score INTEGER NOT NULL,
  mode TEXT NOT NULL,
  difficulty TEXT,
  wrap BOOLEAN DEFAULT FALSE,
  practice BOOLEAN DEFAULT FALSE,
  theme TEXT,
  palette TEXT,
  replay JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
