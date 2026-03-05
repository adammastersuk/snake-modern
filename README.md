# Modern Snake (Next.js 14)

Production-ready Snake built with Next.js App Router, TypeScript, Tailwind, deterministic simulation, replay sharing, and optional leaderboard persistence.

## Features

- **Modern mode**: gradient neon glow + subtle ambient background animation.
- **Retro mode**: pixel grid, CRT scanlines, retro font.
- **Deterministic engine**:
  - fixed timestep simulation
  - seeded pseudo-random generation
- **Core gameplay**:
  - Arrow keys / WASD
  - growth on food
  - wall + self collision
  - wrap-around toggle
  - pause / restart
  - progressive speed increase
- **Advanced systems**:
  - difficulty presets: Casual / Classic / Hardcore
  - practice mode (disables self collision)
  - replay export (JSON) and import (JSON or compressed)
  - deterministic replay playback
  - shareable replay links via `?replay=`
  - replay timeline scrubber
- **Mobile**:
  - swipe input on the canvas
  - optional on-screen D-pad
- **Leaderboard**:
  - `GET /api/scores`
  - `POST /api/scores`
  - replay verification before accepting score
  - uses `POSTGRES_URL` when available; otherwise in-memory fallback

## Controls

- Move: `Arrow keys` or `WASD`
- Start / Pause: `Space`
- Restart: `R`
- Mobile: swipe and optional D-pad

## Replay system

A replay stores:
- RNG seed
- game config
- input events (`step + direction`)
- final step

This allows deterministic reconstruction of a run. Replays can be shared through the `?replay=` query parameter using compressed base64url payloads.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Testing

```bash
npm run test
```

Includes Vitest coverage for:
- simulation determinism
- difficulty presets
- replay compression round-trip

## Deployment (Vercel)

This app is ready for Vercel deployment with no unsupported Next config.

1. Push repository.
2. Import project in Vercel.
3. Set optional environment variables:
   - `POSTGRES_URL` (optional, for global leaderboard)
4. Deploy.

## Leaderboard SQL schema

```sql
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  name TEXT,
  score INTEGER NOT NULL,
  length INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  mode TEXT NOT NULL,
  wrapAround BOOLEAN NOT NULL,
  practiceMode BOOLEAN NOT NULL,
  replay JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_rank ON scores (score DESC, created_at DESC);
```
