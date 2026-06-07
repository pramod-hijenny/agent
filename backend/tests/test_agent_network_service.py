"""Access control for agent-network service helpers."""
import asyncio
import os
import sys

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.agent_network import service  # noqa: E402


def test_list_conversations_only_returns_conversations_involving_user_agent(monkeypatch):
    async def fake_agent_by_user(user_id, _token):
        assert user_id == "user-a"
        return {"id": "agent-a", "name": "Agent A"}

    async def fake_agent_by_id(agent_id, _token):
        return {"id": agent_id, "name": f"{agent_id} name", "full_name": f"{agent_id} full"}

    async def fake_select(table, params, _token):
        if table == "agent_network_conversations":
            assert params["limit"] == "200"
            return [
                {
                    "id": "owned",
                    "owner_user_id": "user-a",
                    "source_agent_id": "agent-a",
                    "candidate_agent_id": "agent-b",
                },
                {
                    "id": "participant",
                    "owner_user_id": "user-b",
                    "source_agent_id": "agent-b",
                    "candidate_agent_id": "agent-a",
                },
                {
                    "id": "unrelated",
                    "owner_user_id": "user-c",
                    "source_agent_id": "agent-c",
                    "candidate_agent_id": "agent-d",
                },
            ]
        if table == "agent_network_turns":
            return [{"conversation_id": params["conversation_id"].removeprefix("eq.")}]
        raise AssertionError(f"unexpected table {table}")

    monkeypatch.setattr(service, "agent_by_user", fake_agent_by_user)
    monkeypatch.setattr(service, "agent_by_id", fake_agent_by_id)
    monkeypatch.setattr(service.insforge, "select", fake_select)

    result = asyncio.run(service.list_conversations({"id": "user-a", "token": "token"}))

    assert [row["id"] for row in result] == ["owned", "participant"]


def test_get_run_rejects_foreign_owner(monkeypatch):
    async def fake_select(table, _params, _token):
        assert table == "agent_network_tasks"
        return [{"id": "run-1", "owner_user_id": "other-user"}]

    monkeypatch.setattr(service.insforge, "select", fake_select)

    with pytest.raises(HTTPException) as exc:
        asyncio.run(service.get_run("run-1", {"id": "user-a", "token": "token"}))

    assert exc.value.status_code == 404
