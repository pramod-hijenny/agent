import json
from datetime import UTC, datetime
from uuid import UUID, uuid4

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.workflows import (
    generate_agent_reply,
    resume_agent_workflow,
    start_agent_workflow,
)
from app.core.config import get_settings
from app.core.security import decode_access_token
from app.db.session import get_session
from app.models import AgentRun
from app.schemas import (
    AgentRunCreate,
    AgentRunRead,
    AgentRunResume,
    AgentTestRead,
    AgentTestRequest,
)

router = APIRouter(prefix="/agents", tags=["agents"])

_RUN_RECORDS: dict[str, AgentRunRead] = {}


async def get_agent_identity(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    settings = get_settings()
    if settings.app_env != "production" and token == "demo-agentcircle-local":
        return "demo-agentcircle-local"
    try:
        return str(decode_access_token(token))
    except Exception:
        pass

    url = f"{settings.insforge_url.rstrip('/')}/api/auth/sessions/current"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, headers={"Authorization": f"Bearer {token}"})
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=401, detail="Could not validate InsForge session") from exc

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    payload = response.json()
    user = payload.get("user") or payload.get("data", {}).get("user") or payload
    user_id = user.get("id") if isinstance(user, dict) else None
    email = user.get("email") if isinstance(user, dict) else None
    if not user_id and not email:
        raise HTTPException(status_code=401, detail="InsForge session has no identity")
    return str(user_id or email)


def jsonable(payload: dict) -> dict:
    return json.loads(json.dumps(payload, default=str))


def serialize_run(row: AgentRun) -> AgentRunRead:
    return AgentRunRead(
        id=row.id,
        workflow=row.workflow,
        status=row.status,
        thread_id=row.thread_id,
        input=row.input,
        output=row.output,
        error=row.error,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


async def save_run_if_possible(
    session: AsyncSession,
    identity: str,
    run: AgentRunRead,
) -> None:
    try:
        user_id = UUID(identity)
    except ValueError:
        return
    row = AgentRun(
        id=run.id,
        user_id=user_id,
        workflow=run.workflow,
        status=run.status,
        thread_id=run.thread_id,
        input=run.input,
        output=run.output,
        error=run.error,
        created_at=run.created_at,
        updated_at=run.updated_at,
    )
    session.add(row)
    try:
        await session.commit()
    except SQLAlchemyError:
        await session.rollback()


async def get_saved_run_if_possible(session: AsyncSession, thread_id: str) -> AgentRun | None:
    try:
        return await session.scalar(select(AgentRun).where(AgentRun.thread_id == thread_id))
    except SQLAlchemyError:
        await session.rollback()
        return None


@router.post("/runs", response_model=AgentRunRead)
async def create_run(
    payload: AgentRunCreate,
    authorization: str | None = Header(default=None),
    session: AsyncSession = Depends(get_session),
) -> AgentRunRead:
    identity = await get_agent_identity(authorization)
    state = dict(payload.state)
    state["user_id"] = identity
    now = datetime.now(UTC)
    try:
        output = jsonable(start_agent_workflow(payload.thread_id, state))
        status = "waiting_for_approval" if "__interrupt__" in output else "completed"
        error = ""
    except Exception as exc:
        output = {}
        status = "failed"
        error = str(exc)
    run = AgentRunRead(
        id=uuid4(),
        workflow=payload.workflow,
        status=status,
        thread_id=payload.thread_id,
        input=state,
        output=output,
        error=error,
        created_at=now,
        updated_at=now,
    )
    _RUN_RECORDS[payload.thread_id] = run
    await save_run_if_possible(session, identity, run)
    return run


@router.post("/runs/{thread_id}/resume", response_model=AgentRunRead)
async def resume_run(
    thread_id: str,
    payload: AgentRunResume,
    authorization: str | None = Header(default=None),
    session: AsyncSession = Depends(get_session),
) -> AgentRunRead:
    await get_agent_identity(authorization)
    db_run = await get_saved_run_if_possible(session, thread_id)
    run = serialize_run(db_run) if db_run else _RUN_RECORDS.get(thread_id)
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")
    now = datetime.now(UTC)
    try:
        output = jsonable(resume_agent_workflow(thread_id, payload.decision, run.output))
        updated = run.model_copy(
            update={"status": "completed", "output": output, "error": "", "updated_at": now}
        )
    except Exception as exc:
        updated = run.model_copy(update={"status": "failed", "error": str(exc), "updated_at": now})
    _RUN_RECORDS[thread_id] = updated
    if db_run:
        db_run.status = updated.status
        db_run.output = updated.output
        db_run.error = updated.error
        db_run.updated_at = updated.updated_at
        await session.commit()
    return updated


@router.post("/test", response_model=AgentTestRead)
async def test_agent(
    payload: AgentTestRequest,
    authorization: str | None = Header(default=None),
) -> AgentTestRead:
    identity = await get_agent_identity(authorization)
    state = dict(payload.state)
    state["user_id"] = identity
    result = generate_agent_reply(state, payload.message)
    return AgentTestRead(
        reply=result["message"],
        source=result["draft_source"],
        error=result["llm_error"],
    )

