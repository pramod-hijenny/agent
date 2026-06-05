# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AgentCircle (user-facing brand: **Get My Bee**; npm package name `get-my-bee`) — an AI-mediated social discovery app for startup communities. Users configure an AI social representative, discover compatible people, review agent-to-agent context, and approve introductions before anything is sent.

The repo is a React frontend (root) backed entirely by **InsForge** (BaaS) — database, auth, storage, realtime, and Deno **edge functions**. The agent/LLM workflows (discovery scoring, intro drafting, the test-my-bee reply) run as edge functions in `functions/`; they call an OpenAI-compatible LLM and persist run state to the `agent_runs` table.

> A Python FastAPI service used to live in `backend/` (deployed on Render) for these workflows. It was removed once the four endpoints it served were ported to InsForge edge functions — see git history (`backend/app/agents/workflows.py`) if you need the original logic.

The frontend uses `localStorage` (`src/lib/store.ts`) and mock data (`src/lib/mock-data.ts`) as fallbacks; InsForge is the intended target for all data.

## Frontend

Vite + React 19 + TypeScript, Tailwind v4, shadcn-style primitives over Radix, Bun.

### Commands (run from repo root)

- `bun install` — install dependencies
- `bun run dev` — Vite dev server (binds 127.0.0.1)
- `bun run build` / `bun run build:dev` — production / dev-mode build
- `bun run lint` — ESLint over the repo
- `bun run format` — Prettier write
- No test runner is wired up. Before opening a change, run `bun run lint` and `bun run build`.

### Environment variables (`.env`)

- `VITE_INSFORGE_URL` — InsForge API base (e.g. `https://mep6b952.us-east.insforge.app`)
- `VITE_INSFORGE_ANON_KEY` — Anonymous JWT key for InsForge SDK

There is no separate API URL — agent calls go through `insforge.functions.invoke(...)` against the InsForge functions host. LLM credentials live as InsForge **function secrets** (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`), not in `.env`.

### Routing & app shell

Hand-rolled router in `src/lib/navigation.tsx`. `src/App.tsx` switches on `pathname`:

- Routes under `/app/*` render inside `AppLayout`
- `/`, `/auth`, `/onboarding` render standalone
- Dynamic route params (e.g. `/app/profile/:id`) extracted by regex in `App.tsx`, consumed via `useRouteParams()`

Route components are code-split via `React.lazy()` in `App.tsx` (each is `lazy(() => import("@/routes/x").then((m) => ({ default: m.Named })))`) and rendered inside a `Suspense` + `AppErrorBoundary` (keyed on `pathname`, so an error in one route doesn't take down the shell).

When adding a route: create file in `src/routes/`, add a `lazy()` import in `App.tsx`, add a branch in `renderAppRoute` (or the top-level `if` chain in `AppRoutes` for non-`/app` routes), and add an entry to the `TITLES` map. `/app` and `/app/feed` redirect to `/app/home`.

### Frontend data layer

- `src/lib/store.ts` — `localStorage`-backed store; seam to replace with API calls
- `src/lib/api.ts` — thin wrappers over `insforge.functions.invoke(...)` for the four agent edge functions (`discover`, `agent-run-start`, `agent-run-resume`, `agent-test`). Each takes a `token` (from `getInsforgeAccessToken()`) forwarded as a `Bearer` header and throws on `{ error }`.
- `src/lib/auth.ts` — InsForge auth helpers (session management, sign-in/out)
- `src/lib/types.ts` — canonical domain types (`Profile`, `Permissions`, `IntroRequest`, `AgentPersona`). `DEFAULT_PERMISSIONS` is source of truth for new-user permission defaults; `can_send_without_approval`, `can_share_phone`, `can_share_email` default to `false`
- `src/lib/matching.ts` — client-side match scoring against mock data
- `src/lib/a2a.ts` — A2A Agent Card discovery helpers
- `src/lib/mock-data.ts` — seed profiles for prototype
- `src/lib/social-posts.ts` — `AgentPost` types and InsForge queries for the in-app agent-authored social feed (visibility, tags, stats, viewer state)
- `src/lib/direct-messages.ts` — `localStorage`-backed state for the `/app/inbox` ("Messages") agent-mediated DM feature (keyed `getmybee:direct-messages:<userId>`, seeded from `mock-data`). When the recipient runs an agent, outbound messages are screened against `BLOCKED_TERMS` and held with a rewrite prompt; otherwise delivered. Not yet wired to InsForge.
- `src/hooks/useMediaAssets.ts` — uploads to InsForge Storage and manages metadata in `media_assets`

Note: the rtrvr.ai browser-automation social sync was removed in commit `a13b81f`; ignore lingering `VITE_RTRVR_*` entries in `.env` if present.

### UI conventions

- Path alias `@/*` → `src/*` (via `vite-tsconfig-paths`)
- shadcn-style primitives in `src/components/ui/`; feature components directly under `src/components/`
- Tailwind v4 with `@tailwindcss/vite`; tokens in `src/styles.css`

## Backend (InsForge)

Primary BaaS: database (Postgres), auth, file storage, realtime, edge functions, AI gateway.

- **Project:** `f5f2acd0-51ca-47e1-a4cf-3dd3a6f24a5a` (region: us-east)
- **API base:** `https://mep6b952.us-east.insforge.app`
- **Dashboard:** https://insforge.dev/dashboard/project/f5f2acd0-51ca-47e1-a4cf-3dd3a6f24a5a

For backend work, use the **insforge skill** (SDK/app code) or **insforge-cli skill** (infrastructure, migrations, CLI commands).

### Database schema & migrations

Migrations live in `migrations/` and are applied via the InsForge CLI. Key tables:

- `profiles` — user profiles; stores `agent` persona and `permissions` as JSONB columns. Public select, owner-only write via RLS.
- `intro_requests` — proposed introductions with `from_user_id`, `to_user_id`, `message`, `status` (`pending`/`accepted`/`rejected`), and audit fields.
- `media_assets` — file upload metadata (bucket, object_key, owner_user_id, content_type, url)
- `agent_runs` — agent-workflow state, persisted across the start→resume handshake (`thread_id`, `workflow`, `status`, `input`/`output` JSONB). Owner-only RLS. Replaces the old FastAPI in-memory `_RUN_MEMORY`. See `migrations/20260605002513_agent-runs-and-interests.sql` (same migration adds `profiles.interests`).
- Agent post / interaction tables for the in-app social feed (see `migrations/20260513112000_social-network-rebuild.sql` and `migrations/20260601002000_agent-post-interactions.sql`)

All tables use RLS keyed to `auth.uid()`. When adding a table: write a timestamped migration (`YYYYMMDDHHmmss_name.sql`), run via CLI, update TypeScript types.

### Agent workflows (edge functions)

The agent/LLM workflows run as Deno edge functions; source lives in `functions/` and is deployed with `npx @insforge/cli functions deploy <slug> --file functions/<slug>.ts`. Each function builds an authed SDK client from the request's `Bearer` token, 401s if there's no user, handles CORS, and returns JSON. Use the **insforge-cli skill** for deploy/secrets/logs.

| Function           | Replaces                        | Frontend call site                          |
| ------------------ | ------------------------------- | ------------------------------------------- |
| `discover`         | `POST /discover`                | `src/routes/app.discover.tsx`               |
| `agent-run-start`  | `POST /agents/runs`             | `src/components/AgentConversationModal.tsx` |
| `agent-run-resume` | `POST /agents/runs/{id}/resume` | `AgentConversationModal.tsx`                |
| `agent-test`       | `POST /agents/test`             | `src/routes/app.agent.tsx`                  |

Shared logic (ported faithfully from the old FastAPI service):

1. **`buildPersonaPrompt(profile, permissions, memory)`** — LLM system prompt from agent name/tone/mission/memory + allowed/blocked capabilities. Hard rules: never impersonate the human, never share contact details, always draft for approval.
2. **Scoring** — two deterministic variants: `discover` ports `score_profile` (base 25 + community/interest/skill/city/goal/bio bonuses, cap 100); `agent-run-start` ports `score_candidates` (base 40 + 8/shared interest + 6/shared goal + 15 city-in-query, cap 99, top 10). A third, richer client-side variant lives in `src/lib/matching.ts`.
3. **`callLlm(system, user)`** — single OpenAI-compatible chat completion (no LangChain) using the `OPENAI_*` function secrets, `temperature 0.4`; `draft_source: "llm" | "fallback"`, intro ≤55 words, test reply ≤80 words. Falls back to a template when the LLM is unconfigured/empty/errors.
4. **Start → interrupt → resume** — `agent-run-start` scores candidates, drafts an intro, and (if a draft exists) sets `output.__interrupt__` with `status: waiting_for_approval`, upserting the run into `agent_runs` by `thread_id`. `agent-run-resume` loads that row (replacing the old in-memory `_RUN_MEMORY`), merges `approved` + `edited_message`, clears `__interrupt__`, and sets `status: completed`.

**A2A protocol:** the live JSON-RPC endpoint (`POST /a2a/v1`, `persona_match`/`intro_draft`) lived only on the removed FastAPI service and was **not** ported. The static discovery card at `public/.well-known/agent-card.json` remains (served by the frontend) but its `url` no longer points at a live endpoint — re-host it as an edge function if A2A is revived.

## Deployment

- **Frontend** — Render Static Site at `https://agentmatch-circle.onrender.com` (built from `dist/` via `bun run build`). Cloudflare Pages via `wrangler.jsonc` is an alternate.
- **Backend** — none. Agent workflows are InsForge edge functions (deployed via the CLI, above); there is no longer a Render web service. (If a `agentmatch-circle-backend` Render service still exists, delete it from the Render dashboard.)

Legacy / alternate paths (still configured but not the primary):

- InsForge static deploy at `https://mep6b952.insforge.site` — the CLI blocks deploying from `dist/` by name and the project root exceeds the 5,000-file limit, so the workaround is to copy `dist/` to a differently-named folder before deploying.
- Cloudflare Pages via `wrangler.jsonc` (serves `dist/` with SPA fallback).

Don't edit `dist/` directly.

## Specs (`spec/`)

Spec-driven development — read before making product-shape changes:

- `spec/mission.md` — mission, principles, safety model (hard constraints: human approval by default, consent-first, no autonomous contact sharing)
- `spec/task.md` — roadmap, ready/done checklists, launch gates
- `spec/design.md` — technical architecture, data model, design system

## RocketRide

If a task involves AI pipelines, document processing, RAG, or data integration, follow `.claude/rules/rocketride.md` — read the relevant doc(s) under `.rocketride/docs/` before writing RocketRide code.
