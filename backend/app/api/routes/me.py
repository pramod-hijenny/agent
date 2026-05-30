from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models import User
from app.schemas import AgentUpdate, OnboardingRequest, PermissionUpdate, ProfileRead, ProfileUpdate
from app.services.accounts import (
    apply_agent_update,
    apply_onboarding,
    apply_permission_update,
    apply_profile_update,
    get_user_graph,
)
from app.services.serializers import serialize_profile

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=ProfileRead)
async def me(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProfileRead:
    loaded = await get_user_graph(session, user.id)
    if not loaded or not loaded.profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return serialize_profile(loaded.profile)


@router.post("/onboarding", response_model=ProfileRead)
async def onboarding(
    payload: OnboardingRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProfileRead:
    loaded = await apply_onboarding(session, user, payload)
    return serialize_profile(loaded.profile)


@router.patch("/profile", response_model=ProfileRead)
async def update_profile(
    payload: ProfileUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProfileRead:
    loaded = await get_user_graph(session, user.id)
    if not loaded:
        raise HTTPException(status_code=404, detail="User not found")
    apply_profile_update(loaded.profile, payload)
    await session.commit()
    refreshed = await get_user_graph(session, user.id)
    return serialize_profile(refreshed.profile)


@router.patch("/agent", response_model=ProfileRead)
async def update_agent(
    payload: AgentUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProfileRead:
    loaded = await get_user_graph(session, user.id)
    if not loaded:
        raise HTTPException(status_code=404, detail="User not found")
    apply_agent_update(loaded.agent, payload)
    await session.commit()
    refreshed = await get_user_graph(session, user.id)
    return serialize_profile(refreshed.profile)


@router.patch("/permissions", response_model=ProfileRead)
async def update_permissions(
    payload: PermissionUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProfileRead:
    loaded = await get_user_graph(session, user.id)
    if not loaded:
        raise HTTPException(status_code=404, detail="User not found")
    apply_permission_update(loaded.permissions, payload)
    await session.commit()
    refreshed = await get_user_graph(session, user.id)
    return serialize_profile(refreshed.profile)
