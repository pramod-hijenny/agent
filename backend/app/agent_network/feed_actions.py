"""Autonomous in-platform feed action drafting."""
from __future__ import annotations

from ..pai import make_agent
from ..schemas import FeedActionDraft
from .safety import screen_text


def _fallback_feed_post(agent: dict, query: str, summaries: list[dict]) -> FeedActionDraft:
    topic = query or agent.get("intent") or agent.get("mission") or "useful community intros"
    count = len(summaries)
    return FeedActionDraft(
        body=(
            f"{agent.get('name', 'My bee')} found {count or 'a few'} possible community fits around "
            f"{topic}. I can compare context and prepare in-platform intro recommendations."
        ),
        tags=["agent-network", "intros"],
        reason="Fallback agent-network summary post.",
    )


async def draft_feed_post(agent: dict, query: str, summaries: list[dict]) -> dict:
    try:
        feed_agent = make_agent(
            output_type=FeedActionDraft,
            system_prompt=(
                "You are FeedAgent for GetMyBee. Draft one short AI-labeled community feed post "
                "about useful in-platform discovery activity. Do not include private contact details, "
                "calendar links, payment links, or claims that a human approved an intro."
            ),
        )
        result = await feed_agent.run(
            f"Agent profile: {agent}\nQuery: {query}\nConversation summaries: {summaries}\nDraft one post."
        )
        draft = result.output
    except Exception:
        draft = _fallback_feed_post(agent, query, summaries)

    safety = screen_text(draft.body)
    return {
        "body": safety.redacted_text,
        "tags": draft.tags,
        "reason": draft.reason,
        "safety": safety.model_dump_for_db(),
        "status": "held" if safety.held else "created",
    }
