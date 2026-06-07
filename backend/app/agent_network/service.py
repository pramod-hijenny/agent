"""Application-owned orchestration for the internal AI agent network."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from fastapi import HTTPException
from pydantic import BaseModel, Field

from .. import insforge
from .agent_chat import run_agent_conversation
from .discovery import agent_by_id, agent_by_user, discover_matches, model_name
from .feed_actions import draft_feed_post


class AgentNetworkRunRequest(BaseModel):
    kind: Literal["discover", "chat", "feed", "all"] = "all"
    query: str | None = None
    target_agent_id: str | None = None
    limit: int = Field(3, ge=1, le=8)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _insert(table: str, rows: list[dict], token: str) -> list[dict]:
    return await insforge.insert(table, rows, token)


async def _update(table: str, params: dict, patch: dict, token: str) -> list[dict]:
    return await insforge.update(table, params, patch, token)


async def _record_action(
    *,
    task_id: str,
    owner_user_id: str,
    actor_agent_id: str,
    target_agent_id: str | None,
    action_type: str,
    status: str,
    payload: dict,
    safety: dict | None,
    token: str,
) -> dict | None:
    rows = await _insert(
        "agent_actions",
        [
            {
                "task_id": task_id,
                "owner_user_id": owner_user_id,
                "actor_agent_id": actor_agent_id,
                "target_agent_id": target_agent_id,
                "action_type": action_type,
                "status": status,
                "payload": payload,
                "safety": safety or {},
            }
        ],
        token,
    )
    return rows[0] if rows else None


async def _persist_conversation(
    *,
    task_id: str,
    owner_user_id: str,
    source: dict,
    candidate: dict,
    conversation: dict,
    token: str,
) -> dict:
    summary = conversation["summary"]
    rows = await _insert(
        "agent_network_conversations",
        [
            {
                "task_id": task_id,
                "owner_user_id": owner_user_id,
                "source_agent_id": source["id"],
                "candidate_agent_id": candidate["id"],
                "status": "completed",
                "summary": summary.summary,
                "compatibility_score": summary.compatibility_score,
                "risks": summary.risks,
                "next_action": summary.next_action,
            }
        ],
        token,
    )
    saved = rows[0]
    turn_rows = [
        {
            "conversation_id": saved["id"],
            "turn_index": turn["turn_index"],
            "speaker_agent_id": turn["speaker_agent_id"],
            "speaker_role": turn["speaker_role"],
            "message": turn["message"],
            "safety": turn["safety"],
        }
        for turn in conversation["turns"]
    ]
    saved_turns = await _insert("agent_network_turns", turn_rows, token) if turn_rows else []
    return {**saved, "turns": saved_turns}


async def _create_feed_action(task: dict, source: dict, query: str, summaries: list[dict], token: str) -> dict:
    draft = await draft_feed_post(source, query, summaries)
    payload = {"body": draft["body"], "tags": ["ai-authored", *draft["tags"]], "reason": draft["reason"]}
    post_id = None
    if draft["status"] == "created":
        post_rows = await _insert(
            "agent_posts",
            [
                {
                    "author_user_id": task["owner_user_id"],
                    "body": draft["body"],
                    "visibility": "public",
                    "tags": payload["tags"],
                    "media_urls": [],
                }
            ],
            token,
        )
        post_id = post_rows[0]["id"] if post_rows else None
        payload["post_id"] = post_id
    action = await _record_action(
        task_id=task["id"],
        owner_user_id=task["owner_user_id"],
        actor_agent_id=source["id"],
        target_agent_id=None,
        action_type="post",
        status=draft["status"],
        payload=payload,
        safety=draft["safety"],
        token=token,
    )
    return action or {"payload": payload, "status": draft["status"]}


async def start_run(body: AgentNetworkRunRequest, user: dict) -> dict:
    token = user["token"]
    source = await agent_by_user(user["id"], token)
    if not source:
        raise HTTPException(status_code=404, detail="Register your agent first")

    query = (body.query or source.get("intent") or source.get("mission") or "find useful in-platform matches").strip()
    task_rows = await _insert(
        "agent_network_tasks",
        [
            {
                "owner_user_id": user["id"],
                "owner_agent_id": source["id"],
                "kind": body.kind,
                "query": query,
                "target_agent_id": body.target_agent_id,
                "status": "running",
                "model": model_name(),
            }
        ],
        token,
    )
    task = task_rows[0]

    try:
        ranked: list[dict] = []
        matches = []
        conversations: list[dict] = []
        actions: list[dict] = []
        safety_holds: list[dict] = []

        if body.kind in ("discover", "chat", "all"):
            ranked, matches = await discover_matches(
                source,
                token,
                query=query,
                target_agent_id=body.target_agent_id,
                limit=body.limit,
            )
            for match in matches:
                await _record_action(
                    task_id=task["id"],
                    owner_user_id=user["id"],
                    actor_agent_id=source["id"],
                    target_agent_id=match.agent_id,
                    action_type="recommendation",
                    status="created",
                    payload=match.model_dump(),
                    safety={},
                    token=token,
                )

        if body.kind in ("chat", "all"):
            candidate_by_id = {row["agent"]["id"]: row["agent"] for row in ranked}
            if body.target_agent_id and body.target_agent_id not in candidate_by_id:
                target = await agent_by_id(body.target_agent_id, token)
                if target:
                    candidate_by_id[target["id"]] = target
            for match in matches[: min(body.limit, 3)]:
                candidate = candidate_by_id.get(match.agent_id)
                if not candidate:
                    continue
                convo = await run_agent_conversation(source, candidate, query)
                saved = await _persist_conversation(
                    task_id=task["id"],
                    owner_user_id=user["id"],
                    source=source,
                    candidate=candidate,
                    conversation=convo,
                    token=token,
                )
                conversations.append(
                    {
                        **saved,
                        "source": {
                            "id": source["id"],
                            "name": source.get("name"),
                            "full_name": source.get("full_name"),
                        },
                        "candidate": {
                            "id": candidate["id"],
                            "name": candidate.get("name"),
                            "full_name": candidate.get("full_name"),
                        },
                    }
                )
                for turn in convo["turns"]:
                    if turn["safety"].get("status") == "hold":
                        safety_holds.append(turn["safety"])

        if body.kind in ("feed", "all"):
            actions.append(await _create_feed_action(task, source, query, conversations, token))

        result = {
            "matches": [match.model_dump() for match in matches],
            "conversations": conversations,
            "actions": actions,
        }
        status = "held" if safety_holds else "completed"
        updated = await _update(
            "agent_network_tasks",
            {"id": f"eq.{task['id']}"},
            {
                "status": status,
                "result": result,
                "safety_holds": safety_holds,
                "updated_at": _now(),
            },
            token,
        )
        task = updated[0] if updated else {**task, "status": status, "result": result}
    except Exception as exc:
        patch = {"status": "failed", "error": str(exc)[:500], "updated_at": _now()}
        await _update("agent_network_tasks", {"id": f"eq.{task['id']}"}, patch, token)
        raise

    return {"run_id": task["id"], "status": task["status"], "result": task.get("result") or {}}


async def get_run(run_id: str, user: dict) -> dict:
    token = user["token"]
    rows = await insforge.select("agent_network_tasks", {"id": f"eq.{run_id}", "select": "*", "limit": "1"}, token)
    if not rows:
        raise HTTPException(status_code=404, detail="Run not found")
    task = rows[0]
    if task.get("owner_user_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Run not found")
    conversations = await insforge.select(
        "agent_network_conversations",
        {"task_id": f"eq.{run_id}", "select": "*", "order": "created_at.desc"},
        token,
    )
    actions = await insforge.select(
        "agent_actions",
        {"task_id": f"eq.{run_id}", "select": "*", "order": "created_at.desc"},
        token,
    )
    turns_by_conversation: dict[str, list[dict]] = {}
    for conversation in conversations:
        turns_by_conversation[conversation["id"]] = await insforge.select(
            "agent_network_turns",
            {"conversation_id": f"eq.{conversation['id']}", "select": "*", "order": "turn_index.asc"},
            token,
        )
    enriched_conversations = []
    for conversation in conversations:
        source_agent = await agent_by_id(conversation["source_agent_id"], token)
        candidate_agent = await agent_by_id(conversation["candidate_agent_id"], token)
        enriched_conversations.append(
            {
                **conversation,
                "turns": turns_by_conversation.get(conversation["id"], []),
                "source": {
                    "id": conversation["source_agent_id"],
                    "name": source_agent.get("name") if source_agent else None,
                    "full_name": source_agent.get("full_name") if source_agent else None,
                },
                "candidate": {
                    "id": conversation["candidate_agent_id"],
                    "name": candidate_agent.get("name") if candidate_agent else None,
                    "full_name": candidate_agent.get("full_name") if candidate_agent else None,
                },
            }
        )
    return {
        "task": task,
        "conversations": enriched_conversations,
        "actions": actions,
    }


async def list_conversations(user: dict) -> list[dict]:
    token = user["token"]
    source = await agent_by_user(user["id"], token)
    if not source:
        return []
    source_agent_id = source["id"]
    conversations = await insforge.select(
        "agent_network_conversations",
        {"select": "*", "order": "created_at.desc", "limit": "200"},
        token,
    )
    enriched = []
    for conversation in conversations:
        involved = source_agent_id in {
            conversation.get("source_agent_id"),
            conversation.get("candidate_agent_id"),
        }
        if conversation.get("owner_user_id") != user["id"] and not involved:
            continue
        turns = await insforge.select(
            "agent_network_turns",
            {"conversation_id": f"eq.{conversation['id']}", "select": "*", "order": "turn_index.asc"},
            token,
        )
        source_agent = await agent_by_id(conversation["source_agent_id"], token)
        candidate_agent = await agent_by_id(conversation["candidate_agent_id"], token)
        enriched.append(
            {
                **conversation,
                "turns": turns,
                "source": {
                    "id": conversation["source_agent_id"],
                    "name": source_agent.get("name") if source_agent else None,
                    "full_name": source_agent.get("full_name") if source_agent else None,
                },
                "candidate": {
                    "id": conversation["candidate_agent_id"],
                    "name": candidate_agent.get("name") if candidate_agent else None,
                    "full_name": candidate_agent.get("full_name") if candidate_agent else None,
                },
            }
        )
    return enriched
