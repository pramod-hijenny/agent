# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AgentCircle (user-facing brand: **Get My Bee**; npm package name `get-my-bee`) — an AI-mediated social discovery app for startup communities. Users configure an AI social representative, discover compatible people, review agent-to-agent context, and approve introductions before anything is sent.

The repo is a React frontend (root) with two backends:
- **InsForge** (primary BaaS) — database, auth, storage, realtime, functions
- **FastAPI** (`backend/`) — LangChain agent workflows, discovery scoring, intro drafting, A2A endpoint. Deployed alongside the frontend (see Deployment).

The frontend uses `localStorage` (`src/lib/store.ts`) and mock data (`src/lib/mock-data.ts`) as fallbacks; InsForge and the FastAPI backend are the intended targets for all data.

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
- `VITE_API_URL` (optional) — Override default API endpoint for FastAPI calls (defaults to the Render backend URL)

### Routing & app shell

Hand-rolled router in `src/lib/navigation.tsx`. `src/App.tsx` switches on `pathname`:
- Routes under `/app/*` render inside `AppLayout`
- `/`, `/auth`, `/onboarding` render standalone
- Dynamic route params (e.g. `/app/profile/:id`) extracted by regex in `App.tsx`, consumed via `useRouteParams()`

When adding a route: create file in `src/routes/`, import in `App.tsx`, add branch in `renderAppRoute`, add entry to `TITLES` map.

### Frontend data layer

- `src/lib/store.ts` — `localStorage`-backed store; seam to replace with API calls
- `src/lib/api.ts` — API client wrappers for all FastAPI + InsForge calls
- `src/lib/auth.ts` — InsForge auth helpers (session management, sign-in/out)
- `src/lib/types.ts` — canonical domain types (`Profile`, `Permissions`, `IntroRequest`, `AgentPersona`). `DEFAULT_PERMISSIONS` is source of truth for new-user permission defaults; `can_send_without_approval`, `can_share_phone`, `can_share_email` default to `false`
- `src/lib/matching.ts` — client-side match scoring against mock data
- `src/lib/a2a.ts` — A2A Agent Card discovery helpers
- `src/lib/mock-data.ts` — seed profiles for prototype
- `src/lib/social-posts.ts` — `AgentPost` types and InsForge queries for the in-app agent-authored social feed (visibility, tags, stats, viewer state)
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
- Agent post / interaction tables for the in-app social feed (see `migrations/20260513112000_social-network-rebuild.sql` and `migrations/20260601002000_agent-post-interactions.sql`)

All tables use RLS keyed to `auth.uid()`. When adding a table: write a timestamped migration (`YYYYMMDDHHmmss_name.sql`), run via CLI, update TypeScript types.

## Backend (FastAPI — agent orchestration)

Python FastAPI service in `backend/` handles LangChain agent workflows, discovery scoring, and the A2A endpoint. Delegates auth to InsForge (validates Bearer tokens against InsForge session API). Uses `uv` for dependency management.

### Commands

```bash
cd backend
uv sync
uvicorn app.main:app --reload   # runs on :8000
```

### Environment variables (`backend/.env` — see `backend/.env.example`)

LLM provider is **Nebius AI Token Factory** (OpenAI-compatible endpoint). The variables keep the `OPENAI_*` names because the OpenAI SDK is the client.

- `NEBIUS_API_KEY` — Nebius API key (canonical source)
- `OPENAI_API_KEY` — set to the same value as `NEBIUS_API_KEY` (consumed by the OpenAI SDK)
- `OPENAI_BASE_URL` — `https://api.tokenfactory.nebius.com/v1/`
- `OPENAI_MODEL` — model id, e.g. `meta-llama/Meta-Llama-3.1-70B-Instruct`; leave empty to disable LLM drafting (falls back to template)
- `OPENAI_TIMEOUT_SECONDS` — request timeout (default 30)
- `INSFORGE_URL` — InsForge API base for token validation
- `JWT_SECRET` / `JWT_ALGORITHM` — local JWT signing (used for non-InsForge tokens)
- `FRONTEND_ORIGIN` — CORS allowed origin (default: `http://localhost:5173`)
- `APP_ENV` — set to anything except `production` to enable the `demo-agentcircle-local` token bypass
- `PUBLIC_BASE_URL` — used to build A2A agent card URLs
- `DATABASE_URL` / `SYNC_DATABASE_URL` — Postgres (async/sync) for backend-owned tables
- `REDIS_URL` — Redis URL
- `LANGSMITH_TRACING` — toggle LangSmith tracing

### Agent workflow architecture

The agent system lives in `backend/app/agents/workflows.py`:

1. **`build_persona_prompt(profile, permissions, memory)`** — assembles the LLM system prompt from agent name, tone, mission, user-editable memory, and allowed/blocked capabilities. Hard-coded rules: never impersonate the human, never share contact details, always draft for approval.

2. **`score_candidates(state)`** — deterministic scoring: base 40 + 8 per shared interest + 6 per shared goal + 15 for city match, capped at 99. Returns top-10 with plain-language reasons.

3. **`draft_intro_with_langchain(profile, target, persona_prompt, fallback)`** — calls `create_agent(model, tools=[], system_prompt=persona_prompt)` via LangChain; constrained to ≤55-word warm intro. Returns `draft_source: "llm" | "fallback" | "disabled"`.

4. **`start_agent_workflow(thread_id, state)`** — scores candidates, drafts intro, sets `__interrupt__` on the state to pause for human review. Status becomes `waiting_for_approval`.

5. **`resume_agent_workflow(thread_id, decision)`** — merges `approved` + `edited_message` into state, clears `__interrupt__`, logs the decision. Status becomes `completed`.

In-memory state is stored in `_RUN_MEMORY[thread_id]`. Run records are in `_RUN_RECORDS[thread_id]` on the agents router.

### A2A Protocol

Implements the Agent-to-Agent (A2A) protocol at `backend/app/api/routes/a2a.py`:
- `GET /.well-known/agent-card.json` — agent discovery card
- `POST /a2a/v1` — JSON-RPC 2.0 or plain JSON endpoint; supports methods `persona_match` and `intro_draft`
- All A2A responses include `"approval_required": true` — no A2A call bypasses human approval
- Frontend `public/.well-known/agent-card.json` is a static copy for Cloudflare Pages

## Deployment

Primary deploy target is **Render** (see commit `6d7670a` and `README.md` Deployment section).

- **Frontend** — Render Static Site at `https://agentmatch-circle.onrender.com` (built from `dist/` via `bun run build`)
- **Backend** — Render Web Service at `https://agentmatch-circle-backend.onrender.com` (runs `uvicorn app.main:app`)

Frontend `VITE_API_URL` should point at the backend Render URL in production.

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
