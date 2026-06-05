"""Pillar 1 — Agent Registry. Upsert the caller's agent and (re)embed it for
semantic discovery. Writes go with the user's JWT so RLS owner-write applies.
"""
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import insforge, llm
from ..auth import get_current_user
from ..config import settings

router = APIRouter(prefix="/agents", tags=["registry"])

_TONES = {"Friendly", "Professional", "Direct", "Warm", "Curious"}


class AgentUpsert(BaseModel):
    name: str = ""
    persona_tone: str = "Friendly"
    agent_intro: str = ""
    mission: str = ""
    goals: list[str] = []
    interests: list[str] = []
    skills: list[str] = []
    intent: str = ""
    memory: list[str] = []
    agent_mode_enabled: bool = False


def _embed_source(a: AgentUpsert) -> str:
    return (
        f"{a.name}. {a.intent}. Mission: {a.mission}. "
        f"Interests: {', '.join(a.interests)}. "
        f"Skills: {', '.join(a.skills)}. "
        f"Goals: {', '.join(a.goals)}."
    )


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("")
async def upsert_agent(body: AgentUpsert, user: dict = Depends(get_current_user)):
    row = body.model_dump()
    row["persona_tone"] = body.persona_tone if body.persona_tone in _TONES else "Friendly"

    # Best-effort embedding — never blocks the registry write.
    embed_error = ""
    try:
        vec = await llm.embed(_embed_source(body))
        if len(vec) == settings.embed_dim:
            row["embedding"] = "[" + ",".join(str(x) for x in vec) + "]"  # pgvector text form
            row["embedding_model"] = settings.openai_embed_model
        else:
            embed_error = f"embedding dim {len(vec)} != {settings.embed_dim}"
    except Exception as e:  # noqa: BLE001 - degrade gracefully on any embed failure
        embed_error = str(e)

    row["updated_at"] = _now()

    try:
        existing = await insforge.select(
            "agents", {"user_id": f"eq.{user['id']}", "select": "id"}, user["token"]
        )
        if existing:
            saved = await insforge.update("agents", {"user_id": f"eq.{user['id']}"}, row, user["token"])
        else:
            row["user_id"] = user["id"]
            saved = await insforge.insert("agents", [row], user["token"])
    except httpx.HTTPStatusError as e:
        # 409 here almost always means the profiles row doesn't exist yet
        # (agents.user_id references profiles). Finish onboarding first.
        if e.response.status_code == 409:
            raise HTTPException(
                status_code=400,
                detail="Complete your profile (onboarding) before saving your agent.",
            ) from e
        raise HTTPException(status_code=502, detail=f"InsForge write failed: {e.response.status_code}") from e

    agent = saved[0] if saved else None
    if isinstance(agent, dict):
        agent.pop("embedding", None)  # don't ship the raw vector back
    return {"agent": agent, "reembedded": bool(row.get("embedding")), "embed_error": embed_error or None}


# ── Test my Bee ──────────────────────────────────────────────────────────────
# One-shot "how would my agent respond?" reply. The frontend (My Bee page) sends
# a sample message + the user's profile/permissions state; we answer in-persona,
# never sharing contact details or claiming to send anything, and fall back to a
# safe template if the LLM is unavailable. Contract: {reply, source, error}.

_TEST_FALLBACK = (
    "I can help with matching, intro drafts, and privacy-safe recommendations. "
    "Tell me who you'd like to meet and I'll line up a few good fits for your approval."
)


class AgentTestRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    state: dict = {}


class _AgentReply(BaseModel):
    reply: str


def _persona_prompt(profile: dict, permissions: dict) -> str:
    agent = profile.get("agent") or {}
    memory = [str(m) for m in (agent.get("memory") or []) if str(m).strip()]
    allowed = [k.replace("can_", "").replace("_", " ") for k, v in permissions.items() if v is True]
    blocked = [k.replace("can_", "").replace("_", " ") for k, v in permissions.items() if v is False]
    memory_block = "\n".join(f"- {m}" for m in memory) or "- No stored memories yet."
    return (
        f"You are {agent.get('agent_name', 'AgentCircle Agent')}, an AI social representative "
        f"for {profile.get('full_name', 'this member')}.\n"
        f"Tone: {agent.get('tone', 'Warm')}.\n"
        f"Mission: {agent.get('current_mission', 'Find compatible people to meet')}.\n"
        f"Intro boundary: {agent.get('agent_intro', 'Represent the user honestly and briefly')}.\n\n"
        "Stored memory:\n"
        f"{memory_block}\n\n"
        f"Allowed capabilities: {', '.join(allowed) or 'none'}.\n"
        f"Blocked capabilities: {', '.join(blocked) or 'none'}.\n\n"
        "Rules: never impersonate the human, never share contact details without explicit "
        "permission, and draft introductions for human approval rather than sending them."
    )


@router.post("/test")
async def test_agent(body: AgentTestRequest, user: dict = Depends(get_current_user)):
    state = body.state or {}
    profile = state.get("profile") or {}
    permissions = state.get("permissions") or profile.get("permissions") or {}
    system = _persona_prompt(profile, permissions)
    try:
        out = await llm.structured(
            _AgentReply,
            system=system,
            user=(
                "Answer as the user's social representative in under 80 words. "
                "Do not claim to send messages or share contact details.\n\n"
                f"User message: {body.message}"
            ),
        )
        reply = (out.reply or "").strip()
        if reply:
            return {"reply": reply, "source": "llm", "error": ""}
        return {"reply": _TEST_FALLBACK, "source": "fallback", "error": "LLM returned an empty reply"}
    except Exception as e:  # noqa: BLE001 - degrade to a safe template on any LLM failure
        return {"reply": _TEST_FALLBACK, "source": "fallback", "error": str(e)}
