"""Pillar 2 — Discovery. Deterministic spec-§6 score over community agents,
blended with pgvector semantic similarity (match_agents RPC) when a free-text
`need` is given. Reads run with the caller's JWT (RLS); agents are publicly
selectable. City/name come from the embedded profiles row.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .. import insforge, llm
from ..auth import get_current_user
from ..scoring import blend_score, deterministic_score

router = APIRouter(prefix="/discovery", tags=["discovery"])

# Columns to pull for each agent (+ embedded profile fields for display/scoring).
_SELECT = "id,user_id,name,persona_tone,mission,interests,goals,skills,intent,profiles(city,full_name,avatar_color,role,company)"


class Filters(BaseModel):
    city: str | None = None
    goal: str | None = None


class DiscoverRequest(BaseModel):
    need: str | None = None
    filters: Filters = Filters()
    limit: int = 10


def _flatten(row: dict) -> dict:
    """Merge the embedded `profiles` object's display fields up onto the agent."""
    prof = row.get("profiles")
    if isinstance(prof, list):
        prof = prof[0] if prof else {}
    prof = prof or {}
    out = {k: v for k, v in row.items() if k != "profiles"}
    out["city"] = prof.get("city")
    out["full_name"] = prof.get("full_name")
    out["avatar_color"] = prof.get("avatar_color")
    out["role"] = prof.get("role")
    out["company"] = prof.get("company")
    return out


def rank(me: dict, candidates: list[dict], sims: dict[str, float] | None, limit: int) -> list[dict]:
    """Pure: deterministic §6 score blended with optional cosine similarity, top-N."""
    results = []
    for c in candidates:
        det = deterministic_score(me, c)
        sim = sims.get(c["id"]) if sims else None
        results.append(
            {
                "agent": c,
                "score": blend_score(det["score"], sim),
                "deterministic": det["score"],
                "similarity": sim,
                "reasons": det["reasons"],
            }
        )
    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:limit]


@router.post("")
async def discover(body: DiscoverRequest, user: dict = Depends(get_current_user)):
    limit = max(1, min(body.limit, 20))
    token = user["token"]

    mine = await insforge.select(
        "agents", {"user_id": f"eq.{user['id']}", "select": _SELECT, "limit": "1"}, token
    )
    if not mine:
        raise HTTPException(status_code=404, detail="Register your agent first")
    me = _flatten(mine[0])
    me_agent_id = me["id"]

    rows = await insforge.select(
        "agents", {"user_id": f"neq.{user['id']}", "select": _SELECT, "limit": "200"}, token
    )
    candidates = [_flatten(r) for r in rows]

    # Optional structured filters (applied in-process; dataset is small).
    if body.filters.city:
        candidates = [c for c in candidates if (c.get("city") or "").lower() == body.filters.city.lower()]
    if body.filters.goal and body.filters.goal != "any":
        candidates = [c for c in candidates if body.filters.goal in (c.get("goals") or [])]

    # Semantic similarity (only when a free-text need is provided).
    sims: dict[str, float] | None = None
    if body.need:
        try:
            vec = await llm.embed(body.need)
            query = "[" + ",".join(str(x) for x in vec) + "]"
            matches = await insforge.rpc(
                "match_agents", {"query_embedding": query, "exclude_agent": me_agent_id, "k": max(limit * 3, 30)}, token
            )
            sims = {m["agent_id"]: float(m["similarity"]) for m in (matches or [])}
        except Exception:  # noqa: BLE001 — degrade to deterministic-only on embed/RPC failure
            sims = None

    return rank(me, candidates, sims, limit)
