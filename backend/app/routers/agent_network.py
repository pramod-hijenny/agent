"""Internal GetMyBee agent network endpoints."""
from fastapi import APIRouter, Depends

from ..agent_network.service import (
    AgentNetworkRunRequest,
    get_run,
    list_conversations,
    start_run,
)
from ..auth import get_current_user

router = APIRouter(prefix="/agent-network", tags=["agent-network"])


@router.post("/runs")
async def create_run(body: AgentNetworkRunRequest, user: dict = Depends(get_current_user)):
    return await start_run(body, user)


@router.get("/runs/{run_id}")
async def read_run(run_id: str, user: dict = Depends(get_current_user)):
    return await get_run(run_id, user)


@router.get("/conversations")
async def read_conversations(user: dict = Depends(get_current_user)):
    return {"conversations": await list_conversations(user)}
