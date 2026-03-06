# Snake Modern (Next.js 14)

Production-ready Snake built with Next.js App Router, TypeScript, Tailwind, deterministic simulation, replay sharing, and optional leaderboard persistence.

## Themes

The game ships with 4 fully styled themes, each with a distinct board renderer and UI system:

- **Modern**: premium neon-glass aesthetic, refined gradients, glow-driven HUD and controls.
- **Retro**: arcade style with CRT scanlines, pixel-ish UI treatment, stronger contrast, and retro snake/food rendering.
- **Masters Build**: restrained editorial look with minimal premium surfaces designed for showcase polish.
- **3D**: performant faux-3D canvas treatment using depth shading, highlights, shadow faces, and tiled depth cues.

Theme switching updates title, panels, controls, overlays, and canvas rendering while preserving deterministic gameplay.

## Features

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
  - mobile settings drawer with focus trap
- **Leaderboard**:
  - `GET /api/scores`
  - `POST /api/scores`
  - replay verification before accepting score
  - uses `POSTGRES_URL` when available; otherwise in-memory fallback
- **PWA install support**:
  - web manifest (`app/manifest.ts`)
  - home screen metadata + icons
  - lightweight service worker shell cache (`public/sw.js`)

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

## PWA install notes

- Open the deployed app in a mobile browser that supports install prompts.
- Use **Add to Home Screen** / install from browser UI.
- App launches in standalone mode with configured theme/background colors.
- Service worker provides a lightweight cached shell for basic offline revisit behavior.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Testing

```bash
npm run test
npm run build
```

Includes Vitest coverage for:
- simulation determinism
- difficulty presets
- replay compression round-trip

## Deployment (Vercel)

This app is ready for Vercel deployment.

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
