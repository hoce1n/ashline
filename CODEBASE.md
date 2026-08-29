# CODEBASE — ASHLINE

A tour of the repository: what every folder and file is for, what is "the app"
and what is platform scaffolding, and how the pieces fit together.

> ASHLINE is a browser-based endless runner ("dusk ridge courier"): jump wrecks,
> slide under beams, collect coins, keep the line. It runs as a single React
> page whose game is drawn on a `<canvas>` by a hand-rolled 2D engine.

---

## 1. Big picture

The repo is a **TanStack Start** single-page app (React 19 + Vite) that hosts a
canvas game. Two layers coexist in the tree:

| Layer | Where | What it is |
|---|---|---|
| **The app (ASHLINE)** | `src/routes/`, `src/components/game/`, `src/lib/game/`, `src/styles.css` | The game itself — what you actually ship and own. |
| **Platform scaffolding** | `src/lib/auth/`, `src/lib/app-data/`, `src/lib/multiplayer/`, `src/lib/db.ts`, `src/lib/preview-*.ts`, `scripts/`, `server/`, `public/__grok/`, `.grok/` | Pre-wired plumbing provided by the Grok App Builder sandbox. It is opt-in per app; this game uses almost none of it at runtime. |

The rule of thumb: `src/routes/` + `src/components/game/` + `src/lib/game/` is
the product. Almost everything else is infrastructure that keeps the preview,
deploy, branding and QA pipelines working.

Runtime data flow for the game:

```
src/routes/index.tsx
  └─ <AshlineGame/>  (src/components/game/AshlineGame.tsx)
       ├─ owns the <canvas> element + DOM overlays (title/HUD/game-over/mute)
       ├─ instantiates Engine (src/lib/game/engine.ts)
       ├─ Engine drives input (src/lib/game/input.ts), audio (audio.ts), save (save.ts)
       └─ Engine renders to canvas each animation frame, pushes HUD snapshots up to React
```

---

## 2. Root files

| File | Role |
|---|---|
| `README.md` | Public project showcase for the repo. |
| `AGENTS.md` | The App Builder **sandbox contract** — instructions the AI agent must follow when building here (build triage, `startup.sh` rules, preview/QA workflow). Not shipped to users. |
| `package.json` | Deps and npm scripts. Scripts route Vite through `scripts/with-app-env.mjs` so dev/build/preview agree on env flags. |
| `package-lock.json` | Lockfile for the above. |
| `tsconfig.json` | TypeScript config: strict, `@/*` → `./src/*` path alias, `allowJs`/`checkJs` (so TS can type `scripts/*.mjs`), includes `src` + `server`. |
| `vite.config.ts` | Vite config: TanStack Start plugin, Tailwind v4, and several sandbox plugins — PGLite bootstrap, the `/auth/popup` handler, the dev env endpoint, and the PWA plugin. Binds the preview to `0.0.0.0:8080`. |
| `eslint.config.mjs` | Flat ESLint config (typescript-eslint, React hooks, Prettier-compatible). |
| `.prettierrc` | Prettier formatting options (semi, double quotes, trailing commas, 100-col). |
| `.gitignore` | Ignores `node_modules/`, `.env*`, plus sandbox bookkeeping files (`.project_id`, `.github_repo`). |
| `.node_modules.lock` | Marker file used by the sandbox to detect install state. |
| `startup.sh` | **Restart contract.** After the sandbox hibernates, the platform runs this to bring the dev server back up on `0.0.0.0:8080`. It stops any stale `:8081` QA preview, probes `:8080`, and starts `npm run dev` in the background only if it's down. |
| `.vercel/` | **Generated** — output of the production build (`npm run build`); not authored. |
| `migrations/` | SQL schema directory, see §6. |
| `artifacts/`, `assets/`, `screenshots/`, `public/`, `src/`, `scripts/`, `server/`, `.grok/` | See sections below. |

---

## 3. `src/` — application source

### 3.1 Routes (`src/routes/`)

| File | Role |
|---|---|
| `__root.tsx` | The document shell. Sets `<head>` (title "ASHLINE", description, theme color, Google Fonts IBM Plex Sans + Syne, manifest, favicon) and `<body>` (mounts `PreviewHostBridge`, `AuthProvider`, then the route `<Outlet/>`). |
| `index.tsx` | The `/` route — the only page. Renders `<AshlineGame/>`. |

### 3.2 Router scaffolding

| File | Role |
|---|---|
| `router.tsx` | Creates the TanStack Router via a named `getRouter()` export, wiring the custom error component. |
| `routeTree.gen.ts` | **Auto-generated** by TanStack Router. Do not edit. |

### 3.3 Styles

| File | Role |
|---|---|
| `styles.css` | Tailwind v4 entry (`@import "tailwindcss"`). Defines the design tokens (dusk palette: `--color-bg: #0c0c0d`, ember accent `#c45c4a`, etc.), base rules, and the `ash-enter` / `ash-pop` entrance/pop keyframes with a `prefers-reduced-motion` fallback. |

### 3.4 Game (`src/components/game/` + `src/lib/game/`)

This is the actual product.

| File | Role |
|---|---|
| `src/components/game/AshlineGame.tsx` | The React component that owns the whole experience: the `<canvas>`, the loading/failed states, the **title screen** (wordmark, tagline, "Tap or press space", control hints, best score), the in-run **HUD** (score, meters, combo multiplier, best), the **game-over card** ("Line broken" — score, distance, peak combo, new best), the mute button, and mobile-only Jump/Slide buttons. It instantiates the engine once and renders HUD snapshots pushed up by it. |
| `src/lib/game/engine.ts` | The heart of the game — a from-scratch canvas engine. Fixed-timestep (60 Hz) simulation loop with accumulator, gravity/velocity physics, **coyote time** + **jump buffering** + variable jump height, sliding under beams, procedural obstacle spawning with density scaling, AABB collision (substepped at high speed), combo/near-miss scoring, coin collection, particles (dust/ember/spark), floating score text, impact sprite, trauma-based screen shake, hit-stop, squash-and-stretch, object pooling, and all the canvas rendering (parallax sky, midground ridge, procedural ground pattern, vignette). |
| `src/lib/game/input.ts` | Input layer: keyboard (Space/W/Z/↑ jump, S/X/Ctrl/↓ slide, Enter confirm), pointer (tap = jump, downward swipe = slide), gamepad polling, blur/visibility cleanup. |
| `src/lib/game/audio.ts` | All sound effects synthesized live with the Web Audio API (oscillators + filtered noise): jump, land, slide, coin, hit, combo chime, footsteps. No audio files. |
| `src/lib/game/save.ts` | `localStorage` persistence (key `ashline-save-v1`): high score, best combo, best distance, mute preference — with versioned defaults and a migration step. |

### 3.5 UI + shared components (`src/components/`)

| File | Role |
|---|---|
| `src/components/ui/button.tsx` | Reusable `Button` built with Radix `Slot` + class-variance-authority. Variants (default/ghost/outline) and sizes used by the HUD buttons. |
| `src/components/preview-host-bridge.tsx` | Mounts the preview bridge (non-React logic lives in `src/lib/preview-host-bridge.ts`) so the Grok preview chrome can drive in-app navigation; a noop when not embedded. |

### 3.6 `src/lib/` — shared library code

| File | Role |
|---|---|
| `utils.ts` | `cn()` — merges `clsx` + `tailwind-merge` class names. |
| `error-component.tsx` | `AppErrorComponent` — the friendly "Something went wrong" screen wired as the router's `defaultErrorComponent`. |
| `db.ts` | **Server-only** SQL layer. Returns a shared tagged-template/`.query()` client on either **Neon** (real Postgres via `pg`, when `DATABASE_URL` is set) or an embedded **PGLite** (Postgres-in-WASM) fallback for the preview, auto-applying `migrations/*.sql`. Also normalizes result types so both backends return identical shapes. Not used by ASHLINE. |
| `preview-embedder-origin.ts` | Allowlist logic: is the page framed by a Grok preview origin (grok.com, sandbox hosts)? |
| `preview-host-bridge.ts` | The guest side of the Grok preview `postMessage` bridge: versioned message envelopes (hello/ready/navigate/history/location/routes), safe-path validation, and history-root bookkeeping so the preview chrome's Back button never leaves the app. Also `collectRoutePathsFromTree()`. |
| `og/site.json` | Share-card identity: `{ title: "ASHLINE", type: "x:game", card: "custom" }`. Consumed by the branding pipeline, not by the app at runtime. |

### 3.7 `src/lib/auth/` — sign-in plumbing (pre-wired, **not used by this app**)

Better Auth wiring for "Sign in with Grok" (Google/Microsoft/Apple/Email via a
broker). Opt-in per app; ASHLINE has auth disabled (`VITE_AUTH_ENABLED=false`
in `.grok/app-env.json`). Kept in the repo as pre-wired scaffolding.

| File | Role |
|---|---|
| `client.ts` | Browser Better Auth client + provider list + sign-in/sign-out hooks. |
| `provider.tsx` | `AuthProvider` mounted in `__root.tsx` (no-op when auth off). |
| `server.ts` | Server-side Better Auth instance at `/api/auth/*`. |
| `middleware.ts` | `createMiddleware` guard for server functions (`requireUserId`). |
| `use-current-user.ts` | `useCurrentUser()` hook returning a normalized `AppUser`. |
| `email-password.ts` | Optional local email/password flag (off by default). |
| `preview.ts` / `popup.server.ts` | Live-preview OAuth handling (top-level popup for the partitioned iframe). |
| `verify.server.ts`, `gate-identity.server.ts`, `gate-session.server.ts`, `isolation.server.ts`, `pglite-dialect.ts`, `gates.tsx`, `providers.ts` | Session resolution, JWT gate identity, sibling-isolation, PGLite Kysely dialect, and React gate components — all opt-in infra. |
| `*.test.ts` | Unit tests for gate identity. |

### 3.8 `src/lib/app-data/` and `src/lib/multiplayer/` — more opt-in plumbing

| File | Role |
|---|---|
| `app-data/*` | Connector data layer for the Grok viewer (calendar/mail/files via the gate). **Not used by ASHLINE.** |
| `multiplayer/p2p.ts` + `index.ts` | Full-mesh WebRTC room helper. **Not used by ASHLINE.** |

---

## 4. `scripts/` — build & QA tooling

Node `.mjs` scripts that make dev/build/QA/deploy behave. Many have matching
`*.test.mjs` files.

| File | Role |
|---|---|
| `with-app-env.mjs` | Wraps `npm run dev/build/preview` and injects `.grok/app-env.json` (`VITE_AUTH_ENABLED`) into the environment. Only `VITE_`-prefixed keys pass through. |
| `app-env-plugin.mjs` | Dev-only Vite plugin exposing `/__app-env` (the env the running server resolved), read by `check-auth-invariant.mjs`. |
| `grok-pwa-plugin.mjs` | Dev/preview half of the PWA chrome (install tutorial page, manifest, head-tag injection). |
| `grok-pwa-shared.mjs` (+ `.d.mts`) | Single source of truth for head chrome (PWA, extensions.js, OG tags) shared by the Vite plugin and the Nitro middleware. |
| `install-page.html` | The iOS/Android "Add to Home Screen" tutorial page (`?install=1&platform=ios`). |
| `migrate.mjs` | Deploy-time DB migrator: applies `migrations/*.sql` to `DATABASE_URL` inside `npm run build`. |
| `migration-plan.mjs` | Migration bookkeeping shared by deploy (`migrate.mjs`) and preview (`src/lib/db.ts`); keyed by basename, non-recursive. |
| `browser-smoke.mjs` | Playwright QA script: renders desktop + mobile against dev (and, with a baseline, the built preview), checks for visible content and console errors, computes brand warnings, writes screenshots under `screenshots/`. |
| `browser-smoke-verdict.mjs` | Hashing/comparison helpers for smoke verdicts. |
| `browser-guard.mjs` | Safety checks so Playwright capture scripts only hit loopback URLs and write to allowed output paths. |
| `preview-thumbnail.mjs` | Captures the 1280×800 preview thumbnail for the sandbox UI. |
| `preview.mjs` | Owns port `:8081` — the built-output QA preview. `stop`/`restart` kills the current owner first (strict port). |
| `brand-check.mjs` | Brand-asset gate: games must ship a custom share card + `x:game` type + x-banner. |
| `check-auth-invariant.mjs` | Fails if the running dev server and the next build disagree on `VITE_AUTH_ENABLED`. |
| `sign-out-plan.mjs` | Sign-out sequencing for the auth client. |
| `write-atomic.mjs` | Atomic file-write helper used by scripts. |

---

## 5. `server/` — deployed-app middleware

| File | Role |
|---|---|
| `middleware/grok-pwa.ts` | Nitro middleware (production half of the PWA chrome): serves the dynamic web manifest, renders the `?install=1` tutorial, and stream-injects PWA + OG head tags into HTML responses. Auto-registered because `vite.config.ts` sets Nitro `serverDir: "./server"`. |
| `virtual-grok-og-identity.d.ts` | Type declaration for the `virtual:grok-og-identity` module (OG identity baked at build time). |

---

## 6. `migrations/` — database schema

| Path | Role |
|---|---|
| `migrations/auth/0001_auth.sql` | Better Auth schema (user/session/account/verification tables). Lives in `migrations/auth/` (not `migrations/`) so it is **only applied when an app opts into accounts** by copying it up. Not used by ASHLINE. |
| `migrations/*.sql` (if added) | App tables. Applied to Neon on build and to PGLite on startup, tracked by basename in `_migrations`. |

---

## 7. `public/` — static assets served as-is

| Path | Role |
|---|---|
| `sprites/` | The game's art, referenced at runtime by `engine.ts`: `player-run.png`, `player-jump.png`, `player-slide.png` (2×/3× frame sheets), `crate.png`, `spike.png`, `beam.png`, `coin.png` (4-frame), `impact.png` (4-frame), and the painted `sky.jpg` backdrop. |
| `favicon.svg` | Brand favicon — a horizontal "line" mark with an ember segment on near-black. |
| `og.jpg` | Custom social share card ("ASHLINE" over the dusk cover). |
| `x-banner.jpg` | 50:11 banner for X/Twitter game unfurls. |
| `__grok/` | **Platform chrome — do not touch.** App icon (`icon-180.png`) and the `install/` assets/styles for the "Add to Home Screen" tutorial. |

---

## 8. `assets/` and `artifacts/` — art pipeline source

| Path | Role |
|---|---|
| `assets/sprites/<name>/` | Working art for each sprite: `raw-sheet.*` (the AI-generated sheet), `sheet-transparent.png` (background removed), per-frame PNGs (`run-1..6`, `jump-1..4`, etc.), `animation.gif` (preview), and `pipeline-meta.json` (the extraction/crop/align parameters used to build the sheet). `sky/raw.jpg` is the sky source. |
| `artifacts/imagine_images/*.jpg` | The raw AI-generated images that seeded the sprite pipeline (player, obstacles, cover). |

These are **sources** — the shipped, trimmed sheets are the `public/sprites/*.png` files.

---

## 9. `screenshots/`

QA captures written by `scripts/browser-smoke.mjs` and the sandbox preview
thumbnail tooling (`app-builder-preview*.png`, `title.png`, `playing.png`,
`jump.png`, `slide.png`, `after-click.png`, …). Reference material — the README
links a few of them.

---

## 10. `.grok/` — App Builder workspace tooling (agent-side, not shipped)

| Path | Role |
|---|---|
| `app-env.json` | Build flags for the app: `VITE_AUTH_ENABLED=false`, `deploy.database=false` (auth and DB both off for ASHLINE). |
| `status` | Sandbox status probe (workspace-server READY). |
| `Ash-Bold.ttf` / `Ash-Regular.ttf` | Custom display font used in the brand/OG card renders. |
| `cover-src.jpg` / `sky-src.jpg` | Source imagery for the OG card and game sky. |
| `og-card.html` / `x-banner.html` / `render-brand-cards.mjs` / `og-raw.png` / `x-banner-raw.png` / `favicon-*.png` | Brand-pass tooling and source renders that produced `public/og.jpg`, `public/x-banner.jpg` and the favicon. |
| `references/` | How-to docs the agent reads on demand: browser QA, data-and-auth, deploy target, generated art, hibernate/revive, first-scaffold. |
| `skills/` | Skill libraries (design-ui, building-games, controls, auth, neon, og, threejs, sprites/maps generation, xai-api, …). Documentation for the builder, not app code. |

---

## 11. What matters for the game

If you're editing ASHLINE itself, the meaningful files are few:

1. **`src/routes/index.tsx`** — entry point.
2. **`src/components/game/AshlineGame.tsx`** — UI chrome: title, HUD, game over, mute, touch buttons.
3. **`src/lib/game/engine.ts`** — all simulation + rendering.
4. **`src/lib/game/input.ts`**, **`audio.ts`**, **`save.ts`** — controls, sound, persistence.
5. **`src/styles.css`** — design tokens and animations.
6. **`public/sprites/`** — the art the engine draws.

Everything else is scaffolding that keeps the sandbox preview, the Vercel
deploy, the PWA install flow, and the branding/QA gates working.
