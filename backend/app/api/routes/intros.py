from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models import IntroRequest, IntroStatus, Permissions, User
from app.schemas import IntroCreate, IntroRead, IntroUpdate
from app.services.intros import can_transition_intro
from app.services.realtime import manager

router = APIRouter(prefix="/intros", tags=["intros"])


def serialize_intro(intro: IntroRequest) -> IntroRead:
    return IntroRead(
        id=intro.id,
        from_user_id=intro.from_user_id,
        to_user_id=intro.to_user_id,
        message=intro.message,
        status=intro.status.value,
        transcript=intro.transcript,
        summary=intro.summary,
        created_at=intro.created_at,
    )


@router.get("", response_model=list[IntroRead])
async def list_intros(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[IntroRead]:
    rows = (
        await session.scalars(
            select(IntroRequest)
            .where(or_(IntroRequest.from_user_id == user.id, IntroRequest.to_user_id == user.id))
            .order_by(IntroRequest.created_at.desc())
        )
    ).all()
    return [serialize_intro(row) for row in rows]


@router.post("", response_model=IntroRead)
async def create_intro(
    payload: IntroCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> IntroRead:
    permissions = await session.scalar(select(Permissions).where(Permissions.user_id == user.id))
    if permissions and not permissions.can_draft_messages:
        raise HTTPException(status_code=403, detail="Your agent cannot draft intro messages")
    intro = IntroRequest(from_user_id=user.id, **payload.model_dump())
    session.add(intro)
    await session.commit()
    await session.refresh(intro)
    await manager.broadcast(
        [user.id, intro.to_user_id],
        {"type": "intro.created", "intro_id": str(intro.id), "status": intro.status.value},
    )
    return serialize_intro(intro)


@router.patch("/{intro_id}", response_model=IntroRead)
async def update_intro(
    intro_id: UUID,
    payload: IntroUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> IntroRead:
    intro = await session.scalar(select(IntroRequest).where(IntroRequest.id == intro_id))
    if not intro or user.id not in {intro.from_user_id, intro.to_user_id}:
        raise HTTPException(status_code=404, detail="Intro not found")
    try:
        next_status = IntroStatus(payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid intro status") from exc
    if not can_transition_intro(intro, user.id, next_status):
        raise HTTPException(status_code=403, detail="Intro transition is not allowed")
    intro.status = next_status
    await session.commit()
    await session.refresh(intro)
    await manager.broadcast(
        [intro.from_user_id, intro.to_user_id],
        {"type": "intro.updated", "intro_id": str(intro.id), "status": intro.status.value},
    )
    return serialize_intro(intro)
