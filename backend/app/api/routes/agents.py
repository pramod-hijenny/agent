import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.workflows import resume_agent_workflow, start_agent_workflow
from app.api.deps import get_current_user
from app.db.session import get_session
from app.models import AgentRun, User
from app.schemas import AgentRunCreate, AgentRunRead, AgentRunResume

router = APIRouter(prefix="/agents", tags=["agents"])


def serialize_run(run: AgentRun) -> AgentRunRead:
    return AgentRunRead(
        id=run.id,
        workflow=run.workflow,
        status=run.status,
        thread_id=run.thread_id,
        input=run.input,
        output=run.output,
        error=run.error,
        created_at=run.created_at,
        updated_at=run.updated_at,
    )


def jsonable(payload: dict) -> dict:
    return json.loads(json.dumps(payload, default=str))


@router.post("/runs", response_model=AgentRunRead)
async def create_run(
    payload: AgentRunCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AgentRunRead:
    state = dict(payload.state)
    state["user_id"] = str(user.id)
    try:
        output = jsonable(start_agent_workflow(payload.thread_id, state))
        status = "waiting_for_approval" if "__interrupt__" in output else "completed"
        error = ""
    except Exception as exc:
        output = {}
        status = "failed"
        error = str(exc)
    run = AgentRun(
        user_id=user.id,
        workflow=payload.workflow,
        status=status,
        thread_id=payload.thread_id,
        input=state,
        output=output,
        error=error,
    )
    session.add(run)
    await session.commit()
    await session.refresh(run)
    return serialize_run(run)


@router.post("/runs/{thread_id}/resume", response_model=AgentRunRead)
async def resume_run(
    thread_id: str,
    payload: AgentRunResume,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AgentRunRead:
    run = await session.scalar(
        select(AgentRun).where(AgentRun.thread_id == thread_id, AgentRun.user_id == user.id)
    )
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")
    try:
        output = jsonable(resume_agent_workflow(thread_id, payload.decision))
        run.status = "completed"
        run.output = output
        run.error = ""
    except Exception as exc:
        run.status = "failed"
        run.error = str(exc)
    await session.commit()
    await session.refresh(run)
    return serialize_run(run)
