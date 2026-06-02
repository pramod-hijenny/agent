from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models import AgentPersona, AgentRun, Profile, User
from app.schemas import DiscoverRequest, MatchRead
from app.services.accounts import get_user_graph
from app.services.matching import score_profile
from app.services.serializers import serialize_profile

router = APIRouter(prefix="/discover", tags=["discover"])


@router.post("", response_model=list[MatchRead])
async def discover(
    payload: DiscoverRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[MatchRead]:
    loaded = await get_user_graph(session, user.id)
    if not loaded or not loaded.profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if not loaded.permissions.can_recommend_people:
        raise HTTPException(status_code=403, detail="Your agent cannot recommend people")

    candidates = (
        await session.scalars(
            select(Profile)
            .where(Profile.user_id != user.id)
            .where(Profile.community_id == loaded.profile.community_id)
            .options(
                selectinload(Profile.user).selectinload(User.permissions),
                selectinload(Profile.user).selectinload(User.agent).selectinload(AgentPersona.memories),
            )
        )
    ).all()
    scored = [
        score_profile(loaded.profile, candidate, payload.query, payload.city, payload.goal)
        for candidate in candidates
    ]
    scored.sort(key=lambda item: item.score, reverse=True)
    run = AgentRun(
        user_id=user.id,
        workflow="discover",
        status="completed",
        thread_id=f"discover:{user.id}:{uuid4()}",
        input=payload.model_dump(),
        output={"matches": [str(item.profile.user_id) for item in scored[: payload.limit]]},
    )
    session.add(run)
    await session.commit()
    return [
        MatchRead(
            profile=serialize_profile(item.profile),
            score=item.score,
            reasons=item.reasons,
            suggested_activity=item.suggested_activity,
        )
        for item in scored[: payload.limit]
    ]
