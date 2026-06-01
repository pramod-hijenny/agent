# AgentCircle

AgentCircle is an AI-mediated social discovery app for startup communities. Each member configures an AI social representative that discovers compatible people, compares goals and context, drafts warm introductions, and asks for explicit human approval before anything is sent.

> **North-star demo:** "Find me three AI founders in San Francisco building B2B tools — explain why each match matters, then draft an intro I can approve."

---

## Table of Contents

- [How It Works](#how-it-works)
- [Architecture Overview](#architecture-overview)
- [Frontend](#frontend)
- [Backend](#backend)
- [AI Agent System](#ai-agent-system)
- [A2A Protocol](#a2a-protocol)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Development Commands](#development-commands)
- [Specs](#specs)

---

## How It Works

```
User states intent → Agent scores candidates → Human reviews matches
→ Agent drafts intro → Human approves → Recipient accepts → Connection made
```

1. **Onboarding** — user sets profile, goals, interests, skills, location, and configures their AI representative (name, tone, mission, memory, permissions).
2. **Discovery** — user describes who they want to meet. The backend scores all candidates in the community and returns the top matches with structured reasons.
3. **Match review** — user opens a match card, sees shared context, goal alignment, and a plain-language explanation of the fit.
4. **Intro draft** — the agent builds a persona prompt from the user's profile + permissions + memory, calls an LLM via LangChain, and produces a ≤55-word warm intro. A fallback template is used when the LLM is not configured.
5. **Human-in-the-loop approval** — the workflow pauses (`__interrupt__`) and presents the draft to the user. The user can edit, approve, or cancel. Nothing is sent until approval.
6. **Resume** — on approval the workflow resumes, records the decision, and marks the run completed. The intro request is stored with a full audit trail.
7. **Recipient consent** — the recipient accepts or rejects. Contact details remain private unless both sides explicitly allow sharing.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vite)                   │
│  React 19 · TypeScript · Tailwind v4 · Bun          │
│  src/lib/api.ts → InsForge SDK + FastAPI backend     │
└───────────────┬─────────────────────────────────────┘
                │ HTTPS / WebSocket
        ┌───────┴──────────────────────────┐
        │         FastAPI backend           │
        │  /auth  /me  /profiles            │
        │  /discover  /intros               │
        │  /conversations  /ws              │
        │  /agents  /a2a                    │
        └───────┬──────────────────────────┘
                │
        ┌───────┴──────────────────────────┐
        │    LangChain Agent (Python)       │
        │  build_persona_prompt()           │
        │  score_candidates()               │
        │  draft_intro_with_langchain()     │
        │  start_agent_workflow()           │
        │  resume_agent_workflow()          │
        └───────┬──────────────────────────┘
                │
        ┌───────┴──────────────────────────┐
        │       InsForge backend (BaaS)     │
        │  Postgres · Auth · Storage        │
        │  Realtime · Edge Functions        │
        │  AI gateway · Stripe              │
        └──────────────────────────────────┘
```

---

## Frontend

Vite + React 19 + TypeScript, Tailwind v4, shadcn-style primitives over Radix, Bun.

### Directory structure

| Path | Purpose |
|---|---|
| `src/routes/` | File-based screen components (`app.home`, `app.discover`, `app.inbox`, `app.profile.$id`, etc.) |
| `src/components/` | Reusable feature components (`AgentCard`, `MatchCard`, `IntroApprovalModal`, etc.) |
| `src/components/ui/` | shadcn-style Radix primitives |
| `src/lib/api.ts` | API client wrappers for all backend calls |
| `src/lib/types.ts` | Canonical domain types (`Profile`, `Permissions`, `IntroRequest`, `AgentPersona`) |
| `src/lib/store.ts` | `localStorage`-backed store (migration seam for API calls) |
| `src/lib/navigation.tsx` | Lightweight client-side router with `popstate`-based re-renders |
| `src/lib/matching.ts` | Client-side match scoring (used against mock data) |
| `src/lib/a2a.ts` | A2A Agent Card discovery helpers |
| `src/lib/social-posts.ts` | `SocialPost` / `SocialSyncRun` types and InsForge queries |
| `src/lib/rtrvr.ts` | rtrvr.ai MCP client for browser-automation social sync |
| `src/hooks/useMediaAssets.ts` | Upload hook for InsForge Storage + `media_assets` table |

### Routing

`src/App.tsx` switches on `pathname`. Routes under `/app/*` render inside `AppLayout`; `/`, `/auth`, `/onboarding` render standalone. Dynamic params (e.g. `/app/profile/:id`) are extracted by regex and consumed via `useRouteParams()`.

---

## Backend

The backend has two layers:

### 1. InsForge (primary BaaS)

InsForge provides the database (Postgres), auth, file storage, realtime, and edge functions. All RLS policies are keyed to `auth.uid()`.

- **Project:** `f5f2acd0-51ca-47e1-a4cf-3dd3a6f24a5a` (region: us-east)
- **API base:** `https://mep6b952.us-east.insforge.app`
- **Dashboard:** https://insforge.dev/dashboard/project/f5f2acd0-51ca-47e1-a4cf-3dd3a6f24a5a

Key tables:

| Table | Contents |
|---|---|
| `profiles` | User profiles with agent persona info and permissions |
| `media_assets` | File upload metadata (bucket, object key, URL, owner) |
| `social_posts` | Social media posts synced via rtrvr.ai (LinkedIn, X, etc.) |
| `social_sync_runs` | Audit log of each platform sync run |

### 2. FastAPI (agent orchestration)

`backend/` is a Python FastAPI service responsible for the LangChain agent workflow, discovery scoring, intro drafting, and the A2A endpoint. It delegates auth to InsForge (validates Bearer tokens against InsForge's session API) and stores in-memory run state.

Run with:
```bash
cd backend
uv sync
uvicorn app.main:app --reload
```

---

## AI Agent System

The agent lives in `backend/app/agents/` and has three responsibilities: **persona building**, **candidate scoring**, and **intro drafting**.

### Persona prompt (`workflows.py: build_persona_prompt`)

Every agent action starts by assembling a system prompt from the user's stored profile:

```
You are {agent_name}, an AI social representative for {full_name}.
Tone: {tone}. Mission: {current_mission}.
Intro boundary: {agent_intro}.
Stored memory: [user-edited facts and preferences]
Allowed capabilities: recommend people, draft messages, ...
Blocked capabilities: send without approval, share phone, ...
Rules: never impersonate the human, never share contact details without
explicit permission, draft introductions for human approval rather than sending them.
```

The `memory` field is user-editable — members can add, remove, and tune what their agent "knows" about them.

### Candidate scoring (`workflows.py: score_candidates`)

Scoring is deterministic and explainable (no black-box ML):

```
base score = 40
+ 8 per shared interest (up to profile's interests)
+ 6 per shared goal
+ 15 if candidate's city matches the discovery query
capped at 99
```

Reasons are stored alongside scores (`"Shared interests: AI, startups"`) so the UI can display a plain-language explanation for every match.

### Intro drafting (`workflows.py: draft_intro_with_langchain`)

1. Checks `permissions.can_draft_messages` — returns early if disabled.
2. Builds a persona prompt.
3. Calls `create_agent(model, tools=[], system_prompt=persona_prompt)` via LangChain.
4. Sends a constrained prompt: draft one warm intro ≤55 words, do not imply approval has already happened.
5. Falls back to a template message if the LLM is not configured or returns empty.
6. Returns `{ message, draft_source: "llm" | "fallback" | "disabled", llm_error }`.

### Human-in-the-loop workflow (`workflows.py: start_agent_workflow`)

```
start_agent_workflow(thread_id, state)
  → load_memory(profile)
  → build_persona_prompt(...)
  → score_candidates(state)          # returns top-10 matches
  → draft_intro(state, persona_prompt)
  → if draft exists:
      state["__interrupt__"] = [{ action: "review_intro", draft_message, matches }]
      status = "waiting_for_approval"
  → persist state in _RUN_MEMORY[thread_id]
```

The `__interrupt__` signal pauses the workflow. The frontend surfaces the draft and match list; the user edits or approves.

```
resume_agent_workflow(thread_id, decision)
  → merge decision.approved + decision.edited_message into state
  → clear __interrupt__
  → log "human approved intro" / "human rejected intro"
  → status = "completed"
```

The full state (persona prompt, matches, draft, approval decision) is retained for auditability.

### Agent test endpoint

`POST /agents/test` accepts a user message and returns the agent's reply as a social representative — useful for testing tone and persona before activating discovery.

---

## A2A Protocol

AgentCircle implements the [Agent-to-Agent (A2A) protocol](https://google.github.io/A2A/) so that external AI systems can interoperate with it.

### Agent Card

Published at `GET /.well-known/agent-card.json` and `GET /.well-known/agent-card.json` (backend). Describes capabilities, skills, and the JSON-RPC endpoint.

### Skills

| Skill ID | Description |
|---|---|
| `persona_match` | Accepts two agent personas + candidate list; returns scored compatibility results. Calls `score_candidates()` directly. |
| `intro_draft` | Accepts sender profile + target profile + permissions; calls `draft_intro_with_langchain()` and returns the draft. Always sets `approval_required: true`. |

### Calling the A2A endpoint

Standard JSON-RPC 2.0 or plain JSON:

```json
POST /a2a/v1
{
  "jsonrpc": "2.0",
  "id": "req-1",
  "method": "intro_draft",
  "params": {
    "profile": { "full_name": "Alex", "interests": ["AI", "B2B SaaS"], "goals": ["find investors"] },
    "target_profile": { "full_name": "Maya", "interests": ["AI"], "goals": ["find founders"] },
    "permissions": { "can_draft_messages": true }
  }
}
```

Response always includes `"approval_required": true` — no A2A call bypasses human approval.

---

## API Reference

All routes are served from the FastAPI backend (`backend/app/api/routes/`).

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/auth/magic-link` | Send magic-link email |
| `POST` | `/auth/verify` | Verify magic-link token → JWT |
| `GET` | `/me` | Current user + profile |
| `PATCH` | `/me` | Update current user's profile |
| `POST` | `/onboarding` | Complete onboarding (profile + agent + permissions) |
| `GET` | `/profiles` | List profiles in community |
| `GET` | `/profiles/{id}` | Fetch a single profile |
| `POST` | `/discover` | Score and rank candidate matches |
| `POST` | `/intros` | Create an intro request |
| `GET` | `/intros` | List intros for current user |
| `PATCH` | `/intros/{id}` | Update intro status (accept / reject) |
| `GET` | `/conversations` | List conversations |
| `POST` | `/conversations` | Start a conversation |
| `GET` | `/conversations/{id}/messages` | Fetch messages |
| `POST` | `/conversations/{id}/messages` | Send a message |
| `POST` | `/agents/runs` | Start an agent workflow run |
| `POST` | `/agents/runs/{thread_id}/resume` | Resume after human approval |
| `POST` | `/agents/test` | Test the agent persona with a message |
| `GET` | `/.well-known/agent-card.json` | A2A agent card |
| `POST` | `/a2a/v1` | A2A JSON-RPC endpoint |
| `WS` | `/ws/{conversation_id}` | Realtime message channel |

---

## Environment Variables

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_INSFORGE_URL` | InsForge API base URL |
| `VITE_INSFORGE_ANON_KEY` | InsForge anonymous JWT |
| `VITE_API_URL` | FastAPI backend base URL (optional override) |
| `VITE_RTRVR_API_KEY` | rtrvr.ai API key for social-post sync |
| `VITE_RTRVR_DEVICE_ID` | rtrvr device ID (from Chrome extension popup) |

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | LLM key for intro drafting (optional; falls back to template) |
| `OPENAI_MODEL` | Model name, e.g. `gpt-4o-mini` |
| `OPENAI_BASE_URL` | Override for OpenAI-compatible endpoints |
| `OPENAI_TIMEOUT_SECONDS` | Request timeout (default: 30) |
| `INSFORGE_URL` | InsForge API base (for token validation) |
| `INSFORGE_SERVICE_KEY` | Service-role key for backend-to-InsForge calls |
| `SECRET_KEY` | JWT signing key |
| `APP_ENV` | `development` enables the `demo-agentcircle-local` token |
| `CORS_ORIGINS` | Comma-separated allowed origins |

---

## Development Commands

```bash
# Frontend
bun install
bun run dev        # Vite dev server on 127.0.0.1
bun run build      # Production build
bun run lint       # ESLint
bun run format     # Prettier

# Backend
cd backend
uv sync
uvicorn app.main:app --reload   # FastAPI on :8000
```

Static frontend deploys via Wrangler: `dist/` is served as Cloudflare Pages assets with SPA fallback configured in `wrangler.jsonc`.

---

## Specs

Spec-driven development docs live in `spec/`:

| File | Contents |
|---|---|
| `spec/mission.md` | Product mission, target market, principles, safety model, success metrics |
| `spec/task.md` | Roadmap, ready/done checklists, launch gates |
| `spec/design.md` | Technical architecture, data model, design system, UI direction |

The mission imposes hard constraints: human approval by default, consent-first introductions, AI transparency, and no autonomous contact sharing. Read `spec/mission.md` before making product-shape changes.
