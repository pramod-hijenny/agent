"""Bounded internal agent-agent conversations."""
from __future__ import annotations

from ..pai import make_agent
from ..schemas import AgentConversationSummary, NegotiationTurn
from .safety import screen_text

MAX_TURNS = 4


def _profile_line(agent: dict) -> str:
    return (
        f"name={agent.get('name')}; mission={agent.get('mission')}; intent={agent.get('intent')}; "
        f"interests={agent.get('interests')}; skills={agent.get('skills')}; goals={agent.get('goals')}"
    )


def _fallback_turn(speaker: dict, other: dict, query: str, turn_index: int) -> str:
    if turn_index == 0:
        return (
            f"Hi {other.get('name', 'there')}. I represent {speaker.get('name', 'an agent')}. "
            f"I'm checking fit around {query or speaker.get('intent') or 'current goals'}."
        )
    return (
        f"That seems relevant. {speaker.get('name', 'My agent')} can compare goals, context, "
        "and whether an intro would be useful inside GetMyBee."
    )


async def _agent_turn(speaker: dict, other: dict, query: str, transcript: list[dict], turn_index: int) -> str:
    try:
        agent = make_agent(
            output_type=NegotiationTurn,
            system_prompt=(
                f"You are NegotiatorAgent for {speaker.get('name', 'a GetMyBee agent')}. "
                "Speak as an AI representative inside GetMyBee. Keep it concise, honest, and useful. "
                "Do not share emails, phone numbers, payment links, calendar links, or off-platform contact details."
            ),
        )
        result = await agent.run(
            "You are talking with another member's agent.\n"
            f"Your profile: {_profile_line(speaker)}\n"
            f"Other profile: {_profile_line(other)}\n"
            f"User query: {query}\n"
            f"Transcript so far: {transcript}\n"
            "Write the next single message."
        )
        return result.output.message.strip()
    except Exception:
        return _fallback_turn(speaker, other, query, turn_index)


async def summarize_conversation(source: dict, candidate: dict, query: str, turns: list[dict]) -> AgentConversationSummary:
    try:
        agent = make_agent(
            output_type=AgentConversationSummary,
            system_prompt=(
                "You are SummaryAgent for GetMyBee. Summarize an internal agent-agent conversation. "
                "Return a compatibility score, risks, and the next in-platform action. "
                "Do not recommend off-platform contact."
            ),
        )
        result = await agent.run(
            f"Source: {_profile_line(source)}\nCandidate: {_profile_line(candidate)}\n"
            f"Query: {query}\nTranscript: {turns}"
        )
        return result.output
    except Exception:
        shared = set(source.get("interests") or []) & set(candidate.get("interests") or [])
        score = min(95, 55 + len(shared) * 8)
        return AgentConversationSummary(
            summary=(
                f"{source.get('name', 'The source agent')} and {candidate.get('name', 'the candidate agent')} "
                f"found a plausible fit around {query or source.get('intent') or 'their goals'}."
            ),
            compatibility_score=score,
            risks=[] if shared else ["Limited explicit shared interests"],
            next_action="Recommend an in-platform intro review.",
        )


async def run_agent_conversation(source: dict, candidate: dict, query: str, *, max_turns: int = MAX_TURNS) -> dict:
    if source["id"] == candidate["id"]:
        raise ValueError("Cannot run an agent conversation with the same agent")

    turns: list[dict] = []
    n = max(2, min(max_turns, MAX_TURNS))
    for turn_index in range(n):
        speaker = source if turn_index % 2 == 0 else candidate
        other = candidate if turn_index % 2 == 0 else source
        role = "source" if speaker["id"] == source["id"] else "candidate"
        message = await _agent_turn(speaker, other, query, turns, turn_index)
        safety = screen_text(message)
        turns.append(
            {
                "turn_index": turn_index,
                "speaker_agent_id": speaker["id"],
                "speaker_role": role,
                "message": safety.redacted_text,
                "safety": safety.model_dump_for_db(),
            }
        )

    summary = await summarize_conversation(source, candidate, query, turns)
    return {"turns": turns, "summary": summary}
