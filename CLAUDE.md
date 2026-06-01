# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AgentCircle — an AI-mediated social discovery app for startup communities. Users configure an AI social representative, discover compatible people, review agent-to-agent context, and approve introductions before anything is sent.

The repo is a React frontend (root) with an InsForge backend. The frontend currently uses `localStorage` (`src/lib/store.ts`) and mock data (`src/lib/mock-data.ts`); the backend is InsForge, which provides database, auth, storage, realtime, and serverless functions.

## Frontend

Vite + React 19 + TypeScript, Tailwind v4, shadcn-style primitives over Radix, Bun. Static-only build deployable as Cloudflare Pages assets via `wrangler.jsonc`.

### Commands (run from repo root)

- `bun install` — install dependencies
- `bun run dev` — Vite dev server (binds 127.0.0.1)
- `bun run build` / `bun run build:dev` — production / dev-mode build
- `bun run preview` — preview built app
- `bun run lint` — ESLint over the repo
- `bun run format` — Prettier write
- No test runner is wired up. Before opening a change, run `bun run lint` and `bun run build`. New tests go beside the code as `ComponentName.test.tsx` / `libName.test.ts`; add a `test` script to `package.json` when you introduce one.

### Environment variables (`.env`)

- `VITE_INSFORGE_URL` — InsForge API base (e.g., `https://mep6b952.us-east.insforge.app`)
- `VITE_INSFORGE_ANON_KEY` — Anonymous JWT key for InsForge SDK
- `VITE_API_URL` (optional) — Override default API endpoint for backend calls
- These are loaded by Vite at build time; set them in `.env` before running `dev` or `build`.

### Routing & app shell

Routing is hand-rolled, not a router library. `src/App.tsx` switches on `pathname` from `src/lib/navigation.tsx`:

- `RouterProvider` tracks `window.location.pathname` via `popstate`.
- `navigate(to, { replace })` mutates history and fires a synthetic `popstate` so subscribers re-render.
- Dynamic route params (e.g. `/app/profile/:id`) are extracted by regex in `App.tsx` and passed via `RouteParamsProvider`; `useRouteParams()` consumes them.
- Routes under `/app/*` render inside `AppLayout`; everything else (`/`, `/auth`, `/onboarding`) renders standalone.

When adding a route: create the file in `src/routes/`, import it in `App.tsx`, add a branch in `renderAppRoute` (or top-level), and add an entry to the `TITLES` map.

### Frontend data layer

- `src/lib/store.ts` — `localStorage`-backed user/auth/intros store with a `useSyncExternalStore` subscription pattern. This is the seam to replace with API calls; the backend's `/auth`, `/me`, `/profiles`, `/discover`, `/intros`, `/conversations`, `/ws` endpoints are the intended targets.
- `src/lib/api.ts` — API client wrappers.
- `src/lib/types.ts` — canonical domain types (`Profile`, `Permissions`, `IntroRequest`, `AgentPersona`, etc.). `DEFAULT_PERMISSIONS` is the source of truth for new-user permission defaults.
- `src/lib/matching.ts` — client-side match scoring used against mock data.
- `src/lib/a2a.ts` — A2A Agent Card discovery helpers (agent interoperability).
- `src/lib/mock-data.ts` — seed profiles for the prototype.

### UI conventions

- Path alias `@/*` → `src/*` (configured via `vite-tsconfig-paths`).
- shadcn-style primitives live in `src/components/ui/`; reusable feature components live directly under `src/components/` (e.g. `AgentCard`, `IntroApprovalModal`, `MatchScoreBadge`).
- Tailwind v4 with `@tailwindcss/vite`; tokens/entry in `src/styles.css`.
- Do not import Next.js-only packages (e.g. `server-only`). Do not add a heavier app framework without first updating `spec/design.md`.

### File uploads

- `src/hooks/useMediaAssets.ts` — hook for uploading files to InsForge Storage and managing metadata in the `media_assets` table.
- `src/components/FileUpload.tsx` — drag-and-drop or click-to-upload component with optional agent association.
- `src/components/MediaGallery.tsx` — displays uploaded files in a responsive grid with download/delete actions.
- Files are stored in the public `uploads` bucket; accessible at `https://mep6b952.us-east.insforge.app/storage/v1/object/public/uploads/{filename}`.
- For details, see `FILE_UPLOAD_SETUP.md`.

### Frontend & InsForge integration

The frontend transitions from mock data to InsForge APIs over time:

- During development, mock data is used by default; set `VITE_API_URL` to point to InsForge to test live backend calls.
- API integration lives in `src/lib/api.ts`; the InsForge SDK is used there to fetch data.
- When integrating a new feature, consider whether to start with mock data or add the InsForge call directly.

## Backend (InsForge)

The backend is InsForge — a serverless platform providing database, auth, storage, realtime, and functions. Use the InsForge CLI and SDK for all backend work.

### Setup & CLI Commands

- Already linked to project `f5f2acd0-51ca-47e1-a4cf-3dd3a6f24a5a` (region: us-east)
- Dashboard: https://insforge.dev/dashboard/project/f5f2acd0-51ca-47e1-a4cf-3dd3a6f24a5a
- Common tasks: database CRUD, auth, file storage, functions, realtime updates, emails, billing checkout

### Using InsForge

For backend work, use the **insforge skill** or **insforge-cli skill**:

- `insforge` skill: app code (database CRUD, auth, storage uploads/RLS, functions, realtime, emails, Stripe checkout, subscriptions)
- `insforge-cli` skill: infrastructure (SQL migrations, CLI commands, Stripe catalog setup, S3-compatible tooling)

The frontend's `VITE_API_URL` points to the InsForge backend (configured automatically).

### Database schema & migrations

Migrations live in `migrations/` and are applied via the InsForge CLI. Key tables:

- `profiles` — user profiles with agent persona info, permissions, created/updated timestamps
- `media_assets` — file upload metadata (bucket, object_key, owner_user_id, content_type, url)

All tables use RLS policies keyed to `auth.uid()`; only the logged-in user can see their own data. When adding a table or modifying schema, run migrations via `insforge-cli` and update the relevant data type in TypeScript (`src/lib/types.ts`).

## Specs (`spec/`)

This repo uses spec-driven development. Before making product-shape or stack-shape changes, read the relevant spec:

- `spec/mission.md` — product mission, principles, safety model
- `spec/task.md` — roadmap, ready/done checklists, launch gates
- `spec/design.md` — product + technical architecture, data model, design system

The mission imposes hard constraints (human-in-the-loop, visible trust, consent-gated actions). Anything that hides agent actions, removes approval gates, or shares contact info without explicit permission is out of scope.

## RocketRide

If a task involves AI pipelines, document processing, RAG, or data integration, follow `.claude/rules/rocketride.md` — read the relevant doc(s) under `.rocketride/docs/` before writing RocketRide code.

## Deployment notes

- Static frontend deploys via Wrangler: `dist/` is served as Cloudflare Pages assets with SPA fallback (`wrangler.jsonc`). Don't edit `dist/`, `.output/`, `.vinxi/`, `.wrangler/`, or `.tanstack/` — they're build output.
- Review `wrangler.jsonc` before any deployment-related change.
