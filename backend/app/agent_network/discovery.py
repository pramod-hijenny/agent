"""Agent-network discovery: deterministic rank with optional Pydantic AI polish."""
from __future__ import annotations

from .. import insforge
from ..config import settings
from ..pai import make_agent
from ..schemas import AgentNetworkMatch
from ..scoring import blend_score, deterministic_score

_SELECT = (
    "id,user_id,name,persona_tone,mission,interests,goals,skills,intent,agent_mode_enabled,"
    "profiles(city,full_name,avatar_color,role,company)"
)


def flatten_agent(row: dict) -> dict:
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


async def agent_by_user(user_id: str, token: str) -> dict | None:
    rows = await insforge.select("agents", {"user_id": f"eq.{user_id}", "select": _SELECT, "limit": "1"}, token)
    return flatten_agent(rows[0]) if rows else None


async def agent_by_id(agent_id: str, token: str) -> dict | None:
    rows = await insforge.select("agents", {"id": f"eq.{agent_id}", "select": _SELECT, "limit": "1"}, token)
    return flatten_agent(rows[0]) if rows else None


async def fetch_candidates(me: dict, token: str, *, target_agent_id: str | None = None, limit: int = 30) -> list[dict]:
    if target_agent_id:
        target = await agent_by_id(target_agent_id, token)
        return [target] if target and target["id"] != me["id"] else []
    rows = await insforge.select(
        "agents",
        {"user_id": f"neq.{me['user_id']}", "select": _SELECT, "limit": str(max(limit, 1))},
        token,
    )
    return [flatten_agent(row) for row in rows]


def rank_candidates(me: dict, candidates: list[dict], limit: int) -> list[dict]:
    ranked = []
    for candidate in candidates:
        det = deterministic_score(me, candidate)
        ranked.append(
            {
                "agent": candidate,
                "score": blend_score(det["score"], None),
                "reasons": det["reasons"] or ["Compatible platform agent"],
            }
        )
    ranked.sort(key=lambda row: row["score"], reverse=True)
    return ranked[: max(1, limit)]


def fallback_matches(ranked: list[dict]) -> list[AgentNetworkMatch]:
    matches: list[AgentNetworkMatch] = []
    for row in ranked:
        agent = row["agent"]
        reasons = row["reasons"]
        topic = (agent.get("intent") or agent.get("mission") or "your current goals").strip()
        matches.append(
            AgentNetworkMatch(
                agent_id=agent["id"],
                score=int(row["score"]),
                reasons=reasons,
                opener=f"Your goals overlap around {topic}. Explore whether a warm intro makes sense.",
                risk_flags=[],
            )
        )
    return matches


async def refine_matches(me: dict, ranked: list[dict], query: str) -> list[AgentNetworkMatch]:
    fallback = fallback_matches(ranked)
    if not ranked:
        return []
    try:
        agent = make_agent(
            output_type=list[AgentNetworkMatch],
            system_prompt=(
                "You are MatchmakerAgent for GetMyBee. Refine deterministic matches without changing "
                "agent IDs. Return concise reasons and a practical opener for each candidate. "
                "Do not invent contact details or suggest leaving the platform."
            ),
        )
        prompt_rows = [
            {
                "agent_id": row["agent"]["id"],
                "name": row["agent"].get("name"),
                "mission": row["agent"].get("mission"),
                "intent": row["agent"].get("intent"),
                "interests": row["agent"].get("interests"),
                "skills": row["agent"].get("skills"),
                "score": row["score"],
                "reasons": row["reasons"],
            }
            for row in ranked
        ]
        result = await agent.run(
            f"Source agent: {me.get('name')}; query: {query or me.get('intent')}; candidates: {prompt_rows}"
        )
        by_id = {match.agent_id: match for match in result.output}
        return [by_id.get(match.agent_id, match) for match in fallback]
    except Exception:
        return fallback


async def discover_matches(
    me: dict,
    token: str,
    *,
    query: str,
    target_agent_id: str | None,
    limit: int,
) -> tuple[list[dict], list[AgentNetworkMatch]]:
    candidates = await fetch_candidates(me, token, target_agent_id=target_agent_id, limit=max(limit * 4, 20))
    ranked = rank_candidates(me, candidates, limit)
    refined = await refine_matches(me, ranked, query)
    return ranked, refined


def model_name() -> str:
    return settings.openai_model
