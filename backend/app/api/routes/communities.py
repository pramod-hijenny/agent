from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models import Community, Membership, User
from app.schemas import CommunityRead, MembershipRead
from app.services.serializers import serialize_community, serialize_membership

router = APIRouter(prefix="/communities", tags=["communities"])


@router.get("", response_model=list[CommunityRead])
async def list_my_communities(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[CommunityRead]:
    rows = (
        await session.scalars(
            select(Community)
            .join(Membership, Membership.community_id == Community.id)
            .where(Membership.user_id == user.id)
            .order_by(Community.name)
        )
    ).all()
    return [serialize_community(row) for row in rows if row is not None]


@router.get("/memberships", response_model=list[MembershipRead])
async def list_my_memberships(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[MembershipRead]:
    rows = (
        await session.scalars(
            select(Membership)
            .where(Membership.user_id == user.id)
            .options(selectinload(Membership.community))
            .order_by(Membership.created_at.desc())
        )
    ).all()
    return [serialize_membership(row) for row in rows]
