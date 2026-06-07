"""Bounded agent-agent chat behavior without model calls."""
import asyncio
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.agent_network import agent_chat  # noqa: E402
from app.schemas import AgentConversationSummary  # noqa: E402


def _agent(id_: str) -> dict:
    return {
        "id": id_,
        "name": f"{id_} Bee",
        "mission": "help founders",
        "intent": "find useful intros",
        "interests": ["AI"],
        "skills": ["Product"],
        "goals": ["feedback"],
    }


def test_agent_chat_rejects_self_conversation():
    source = _agent("a1")
    with pytest.raises(ValueError):
        asyncio.run(agent_chat.run_agent_conversation(source, source, "feedback"))


def test_agent_chat_is_bounded_and_redacts_held_turns(monkeypatch):
    async def fake_turn(_speaker, _other, _query, _transcript, turn_index):
        if turn_index == 1:
            return "Useful fit. Email founder@example.com before we continue."
        return f"In-platform turn {turn_index}."

    async def fake_summary(_source, _candidate, _query, _turns):
        return AgentConversationSummary(
            summary="The agents found a possible in-platform fit.",
            compatibility_score=82,
            risks=[],
            next_action="Review the private transcript.",
        )

    monkeypatch.setattr(agent_chat, "_agent_turn", fake_turn)
    monkeypatch.setattr(agent_chat, "summarize_conversation", fake_summary)

    result = asyncio.run(
        agent_chat.run_agent_conversation(_agent("a1"), _agent("a2"), "feedback", max_turns=99)
    )

    assert len(result["turns"]) == agent_chat.MAX_TURNS
    assert result["turns"][1]["safety"]["status"] == "hold"
    assert "founder@example.com" not in result["turns"][1]["message"]
    assert "[email held for approval]" in result["turns"][1]["message"]
    assert result["summary"].compatibility_score == 82
