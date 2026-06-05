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
- [Development Commands](#development-commands)
- [Deployment](#deployment-render)
- [Specs](#specs)

---

## How It Works

```
User states intent → Agent scores candidates → Human reviews matches
→ Agent drafts intro → Human approves → Recipient accepts → Connection made
```

1. **Onboarding** — user sets profile, goals, interests, skills, location, and configures their AI representative (name, tone, mission, memory, permissions).
2. **Discovery** — user describes who they want to meet. The `discover` edge function scores all candidates in the community and returns the top matches with structured reasons.
3. **Match review** — user opens a match card, sees shared context, goal alignment, and a plain-language explanation of the fit.
4. **Intro draft** — the agent builds a persona prompt from the user's profile + permissions + memory, calls an OpenAI-compatible LLM, and produces a ≤55-word warm intro. A fallback template is used when the LLM is not configured.
5. **Human-in-the-loop approval** — the workflow pauses (`__interrupt__`) and presents the draft to the user. The user can edit, approve, or cancel. Nothing is sent until approval.
6. **Resume** — on approval the workflow resumes, records the decision, and marks the run completed. The intro request is stored with a full audit trail.
7. **Recipient consent** — the recipient accepts or rejects. Contact details remain private unless both sides explicitly allow sharing.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│           Frontend — Render Static Site              │
│  React 19 · TypeScript · Tailwind v4 · Bun          │
│  https://agentmatch-circle.onrender.com              │
│  src/lib/api.ts → insforge.functions.invoke(...)     │
└───────────────┬─────────────────────────────────────┘
                │ @insforge/sdk (auth, db, storage)
        ┌───────┴──────────────────────────┐
        │      InsForge (BaaS)              │
        │  Postgres · Auth · Storage        │
        │  Realtime · Edge Functions        │
        └───────┬──────────────────────────┘
                │ Deno edge functions (functions/)
        ┌───────┴──────────────────────────┐
        │  Agent workflows (TypeScript)     │
        │  discover                         │
        │  agent-run-start  (→ interrupt)   │
        │  agent-run-resume                 │
        │  agent-test                       │
        │  → OpenAI-compatible LLM          │
        │  → agent_runs table (run state)   │
        └──────────────────────────────────┘
```

---

## Frontend

Vite + React 19 + TypeScript, Tailwind v4, shadcn-style primitives over Radix, Bun.

### Directory structure

| Path                          | Purpose                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/routes/`                 | File-based screen components (`app.home`, `app.discover`, `app.inbox`, `app.profile.$id`, etc.) |
| `src/components/`             | Reusable feature components (`AgentCard`, `MatchCard`, `IntroApprovalModal`, etc.)              |
| `src/components/ui/`          | shadcn-style Radix primitives                                                                   |
| `src/lib/api.ts`              | Wrappers over `insforge.functions.invoke(...)` for the four agent edge functions                |
| `src/lib/types.ts`            | Canonical domain types (`Profile`, `Permissions`, `IntroRequest`, `AgentPersona`)               |
| `src/lib/store.ts`            | `localStorage`-backed store (migration seam for API calls)                                      |
| `src/lib/navigation.tsx`      | Lightweight client-side router with `popstate`-based re-renders                                 |
| `src/lib/matching.ts`         | Client-side match scoring (used against mock data)                                              |
| `src/lib/a2a.ts`              | A2A Agent Card discovery helpers                                                                |
| `src/hooks/useMediaAssets.ts` | Upload hook for file storage + `media_assets` table                                             |

### Routing

`src/App.tsx` switches on `pathname`. Routes under `/app/*` render inside `AppLayout`; `/`, `/auth`, `/onboarding` render standalone. Dynamic params (e.g. `/app/profile/:id`) are extracted by regex and consumed via `useRouteParams()`.

---

## Backend

The backend is **InsForge** (BaaS): Postgres, auth, storage, realtime, and Deno edge functions. There is no separate server — the agent/LLM workflows run as edge functions in `functions/`, deployed with the InsForge CLI. Auth, profile CRUD, and intro CRUD are done directly from the frontend via `@insforge/sdk`.

> Previously a Python FastAPI service (`backend/`) on Render handled these workflows. It was removed once its four live endpoints were ported to edge functions; see git history for the original LangChain implementation.

Key database tables:

| Table                          | Contents                                                      |
| ------------------------------ | ------------------------------------------------------------- |
| `profiles`                     | User profiles with agent persona info and permissions (JSONB) |
| `intro_requests`               | Proposed introductions with status and audit trail            |
| `media_assets`                 | File upload metadata (bucket, object key, URL, owner)         |
| `agent_runs`                   | Agent-workflow run state across the start→resume handshake    |
| `agent_posts` (+ interactions) | In-app agent-authored social feed                             |

Edge functions (deployed via `npx @insforge/cli functions deploy <slug> --file functions/<slug>.ts`):

| Function           | Purpose                                                    |
| ------------------ | ---------------------------------------------------------- |
| `discover`         | Score and rank candidate matches in the community          |
| `agent-run-start`  | Score candidates, draft an intro, pause for human approval |
| `agent-run-resume` | Finalize the run after approval/rejection                  |
| `agent-test`       | One-shot "test my bee" reply                               |

LLM credentials are stored as InsForge function secrets (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`).

---

## AI Agent System

The agent logic lives in the `functions/` edge functions and has three responsibilities: **persona building**, **candidate scoring**, and **intro drafting**. The logic was ported faithfully from the former Python service (`backend/app/agents/workflows.py` in git history).

### Persona prompt (`buildPersonaPrompt`)

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

### Candidate scoring (`scoreCandidates` / `scoreProfile`)

Scoring is deterministic and explainable (no black-box ML). Two variants exist:

```
# agent-run-start (scoreCandidates) — scores client-supplied candidates
base score = 40
+ 8 per shared interest
+ 6 per shared goal
+ 15 if candidate's city matches the discovery query
capped at 99

# discover (scoreProfile) — scores community profiles from the DB
base score = 25
+ 15 same community  + up to 24 shared interests  + up to 24 complementary skills
+ 10 same city  + 18 aligned goal  + up to 15 query words found in bio
capped at 100
```

Reasons are stored alongside scores (`"Shared interests: AI, startups"`) so the UI can display a plain-language explanation for every match. The richer client-side variant in `src/lib/matching.ts` runs against mock data as a fallback.

### Intro drafting (`draftIntro` → `callLlm`)

1. Checks `permissions.can_draft_messages` — returns early if disabled.
2. Builds a persona prompt.
3. Calls an OpenAI-compatible chat completion (`callLlm`, `temperature 0.4`, no LangChain) with the persona as the system prompt.
4. Sends a constrained prompt: draft one warm intro ≤55 words, do not imply approval has already happened.
5. Falls back to a template message if the LLM is not configured or returns empty.
6. Returns `{ message, draft_source: "llm" | "fallback" | "disabled", llm_error }`.

### Human-in-the-loop workflow (`agent-run-start`)

```
agent-run-start({ thread_id, state })
  → loadMemory(profile)
  → buildPersonaPrompt(...)
  → scoreCandidates(state)            # returns top-10 matches
  → draftIntro(state, personaPrompt)
  → if draft exists:
      output.__interrupt__ = [{ action: "review_intro", draft_message, matches }]
      status = "waiting_for_approval"
  → upsert the run into the agent_runs table (keyed by thread_id)
```

The `__interrupt__` signal pauses the workflow. The frontend surfaces the draft and match list; the user edits or approves.

```
agent-run-resume({ thread_id, decision })
  → load the run from agent_runs (replaces the old in-memory _RUN_MEMORY)
  → merge decision.approved + decision.edited_message into output
  → clear __interrupt__
  → log "human approved intro" / "human rejected intro"
  → status = "completed"
```

The full run (persona-derived output, matches, draft, approval decision) is retained in `agent_runs` for auditability.

### Agent test endpoint

The `agent-test` function accepts a user message and returns the agent's reply as a social representative — useful for testing tone and persona before activating discovery.

---

## A2A Protocol

AgentCircle was designed to expose the [Agent-to-Agent (A2A) protocol](https://google.github.io/A2A/) so external AI systems could interoperate with it (skills `persona_match` and `intro_draft`, always returning `approval_required: true`).

> **Status: not currently live.** The JSON-RPC endpoint (`POST /a2a/v1`) lived only on the removed FastAPI service and was not ported to InsForge. The static discovery card at `public/.well-known/agent-card.json` is still served by the frontend, but its `url` no longer points at a live endpoint. To revive A2A, re-host the endpoint as an InsForge edge function and update the card.

---

## API Reference

The frontend reaches the agent backend exclusively through `insforge.functions.invoke(<slug>, { body })` (see `src/lib/api.ts`). Auth, profiles, and intros use `@insforge/sdk` directly against InsForge tables.

| Function slug      | Body                                                     | Description                                                            |
| ------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `discover`         | `{ query, city?, goal?, limit? }`                        | Score and rank candidate matches in the community                      |
| `agent-run-start`  | `{ thread_id, workflow?, state }`                        | Start an agent run: score candidates + draft intro, pause for approval |
| `agent-run-resume` | `{ thread_id, decision: { approved, edited_message? } }` | Resume the run after human approval/rejection                          |
| `agent-test`       | `{ message, state }`                                     | Test the agent persona with a message                                  |

---

## Development Commands

```bash
# Frontend
bun install
bun run dev        # Vite dev server on 127.0.0.1
bun run build      # Production build
bun run lint       # ESLint
bun run format     # Prettier

# Edge functions (InsForge CLI)
npx @insforge/cli functions deploy discover --file functions/discover.ts
npx @insforge/cli functions list
npx @insforge/cli db migrations up --all   # apply pending migrations
```

## Deployment

| Service             | Type                    | URL                                    |
| ------------------- | ----------------------- | -------------------------------------- |
| `agentmatch-circle` | Render Static Site      | https://agentmatch-circle.onrender.com |
| Agent backend       | InsForge edge functions | deployed via the InsForge CLI          |

**Frontend** — Render builds with Bun (`bun install && bun run build`) and serves the `dist/` folder as a static site (auto-deploys on push to `main`). Cloudflare Pages via `wrangler.jsonc` is an alternate.

**Agent backend** — edge functions in `functions/` are deployed with `npx @insforge/cli functions deploy`; database changes go through `migrations/` applied with the CLI. There is no separate web service.

---

## Specs

Spec-driven development docs live in `spec/`:

| File              | Contents                                                                  |
| ----------------- | ------------------------------------------------------------------------- |
| `spec/mission.md` | Product mission, target market, principles, safety model, success metrics |
| `spec/task.md`    | Roadmap, ready/done checklists, launch gates                              |
| `spec/design.md`  | Technical architecture, data model, design system, UI direction           |

The mission imposes hard constraints: human approval by default, consent-first introductions, AI transparency, and no autonomous contact sharing. Read `spec/mission.md` before making product-shape changes.
