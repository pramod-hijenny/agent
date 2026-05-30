from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models import AgentPersona, Profile, User
from app.schemas import ProfileRead
from app.services.accounts import get_user_graph
from app.services.serializers import serialize_profile

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/search", response_model=list[ProfileRead])
async def search_profiles(
    q: str = "",
    city: str = "",
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ProfileRead]:
    loaded = await get_user_graph(session, user.id)
    if not loaded or not loaded.profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    stmt = (
        select(Profile)
        .where(Profile.user_id != user.id)
        .where(Profile.community_id == loaded.profile.community_id)
        .options(
            selectinload(Profile.user).selectinload(User.permissions),
            selectinload(Profile.user).selectinload(User.agent).selectinload(AgentPersona.memories),
        )
        .limit(50)
    )
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Profile.full_name.ilike(like), Profile.bio.ilike(like)))
    if city:
        stmt = stmt.where(Profile.city.ilike(city))
    rows = (await session.scalars(stmt)).all()
    return [serialize_profile(row) for row in rows]


@router.get("/{profile_id}", response_model=ProfileRead)
async def get_profile(
    profile_id: UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProfileRead:
    loaded = await get_user_graph(session, user.id)
    if not loaded or not loaded.profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = await session.scalar(
        select(Profile)
        .where(Profile.id == profile_id)
        .options(
            selectinload(Profile.user).selectinload(User.permissions),
            selectinload(Profile.user).selectinload(User.agent).selectinload(AgentPersona.memories),
        )
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.user_id != user.id and profile.community_id != loaded.profile.community_id:
        raise HTTPException(status_code=404, detail="Profile not found")
    return serialize_profile(profile)
