# GetMyBee Agent Backend (FastAPI)

The four-pillar agent backend from the spec: **Registry · Discovery · Interaction · Trust**, plus the **Interview** loop. Python FastAPI, deployed on Render (native Python, no Docker). InsForge is the data layer (Postgres/auth) reached over REST.

## Stack (as specified)

- **FastAPI** + **uvicorn**
- **Instructor + Pydantic** for structured LLM calls (`app/llm.py`, `app/schemas.py`)
- **Pydantic AI** for the interview loop only (`app/pai.py`, `app/routers/interviews.py`)
- **Nebius** models — `Kimi-K2.6` (chat: draft + screen), `Qwen3-Embedding-8B` (embeddings, 4096-dim)
- **InsForge** over REST (`app/insforge.py`) — `/api/database/records`, `/api/database/rpc`, `/api/auth/sessions/current`; no Python SDK exists
- **pgvector** in InsForge Postgres (`agents.embedding vector(4096)`, `match_agents` RPC)

## Layout

```
app/
  main.py        FastAPI app + CORS + /health + routers
  config.py      env settings (Nebius + InsForge)
  insforge.py    async REST client (records CRUD, rpc, verify_user)
  auth.py        get_current_user — verifies the InsForge JWT
  llm.py         Instructor (Nebius chat) + embed()
  pai.py         Pydantic AI model wired to Nebius
  schemas.py     Pydantic models (IntroDraft, ScreeningDecision, InterviewScores)
  scoring.py     deterministic §6 score + semantic blend (pure)
  routers/
    agents.py      POST /agents               (Registry: upsert + embed)
    discovery.py   POST /discovery            (Discovery: §6 + match_agents blend)
    messages.py    POST /messages, /{id}/approve, /{id}/deliver  (Interaction + Trust state machine)
    interviews.py  POST /interviews           (Pydantic AI bounded interview loop)
tests/           pytest — scoring, blend, trust decision (4 agent-mode scenarios), app boot/auth-gate
```

## Endpoints

| Method | Path                     | Pillar                                                                                                           |
| ------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| GET    | `/health`                | —                                                                                                                |
| POST   | `/agents`                | Registry — upsert caller's agent + (re)embed                                                                     |
| POST   | `/discovery`             | Discovery — `{need?, filters?, limit?}` → ranked agents + reasons                                                |
| POST   | `/messages`              | Interaction — create (state `requested`; drafts if sender agent-mode on)                                         |
| POST   | `/messages/{id}/approve` | Trust — sender approves → recipient screen (allowlist / mode-off / LLM vs `agent_rules`) → `approved`/`declined` |
| POST   | `/messages/{id}/deliver` | recipient accepts → `delivered` + reputation bump                                                                |
| POST   | `/interviews`            | Interview — bounded Pydantic AI Q&A loop → structured scores                                                     |

State machine: `requested → screened → approved → delivered` (terminal `declined`). Every meaningful action stays human-approved.

## Run locally (review)

```bash
cd backend
uv venv --python 3.12 .venv && uv pip install -r requirements.txt
# create backend/.env with:
#   NEBIUS_API_KEY=<your nebius key>
#   INSFORGE_API_KEY=<ik_... service key from ../.insforge/project.json>
#   INSFORGE_BASE_URL=https://mep6b952.us-east.insforge.app
#   OPENAI_BASE_URL=https://api.tokenfactory.us-central1.nebius.com/v1/
#   OPENAI_MODEL=moonshotai/Kimi-K2.6
#   OPENAI_EMBED_BASE_URL=https://api.tokenfactory.nebius.com/v1/
#   OPENAI_EMBED_MODEL=Qwen/Qwen3-Embedding-8B
uv run uvicorn app.main:app --reload --port 8000
```

Then open **http://localhost:8000/docs** (FastAPI interactive docs) — `/health` works unauthenticated; the rest need an `Authorization: Bearer <InsForge user JWT>` (sign in via the frontend to get one).

Tests: `uv run pytest tests/ -q` (17 pass; LLM is mocked, no network/key needed).

## Deploy (Render, native Python — no Docker)

`render.yaml` is a Blueprint: connect the repo on Render; it builds `backend/` via the Python buildpack and runs `uvicorn app.main:app`. Set the two secrets (`NEBIUS_API_KEY`, `INSFORGE_API_KEY`) in the dashboard. The frontend then points at the service URL via `VITE_API_URL` (frontend rewiring = M6, not yet done).

## Notes

- Schema lives in repo `migrations/` (applied to InsForge via the CLI): `agents` + pgvector, `agent_rules`/`allowlist`/`reputation` + `bump_reputation`, `messages`/`screening_log`, `interviews`.
- The backend uses the **service key** for cross-actor privileged writes (recipient screening, reputation) and the **user JWT** for owner-scoped reads/writes (RLS).
