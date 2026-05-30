from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import AgentMemory, AgentPersona, Community, Membership, Permissions, Profile, User
from app.schemas import AgentUpdate, OnboardingRequest, PermissionUpdate, ProfileUpdate


async def get_or_create_user(session: AsyncSession, email: str) -> User:
    user = await session.scalar(select(User).where(User.email == email.lower()))
    if user:
        return user
    user = User(email=email.lower())
    session.add(user)
    await session.flush()
    community = await get_or_create_demo_community(session)
    session.add(Membership(user_id=user.id, community_id=community.id, role="member"))
    session.add(Profile(user_id=user.id, community_id=community.id))
    session.add(AgentPersona(user_id=user.id, agent_name="Your Agent"))
    session.add(Permissions(user_id=user.id))
    await session.commit()
    return user


async def get_or_create_demo_community(session: AsyncSession) -> Community:
    demo_id = UUID("00000000-0000-4000-8000-000000000001")
    community = await session.get(Community, demo_id)
    if community:
        return community
    community = Community(
        id=demo_id,
        name="SF Builders Circle",
        type="founder_community",
        city="San Francisco",
        description="A trusted demo network of founders, builders, mentors, investors, and operators.",
    )
    session.add(community)
    await session.flush()
    return community


async def get_user_graph(session: AsyncSession, user_id) -> User | None:
    return await session.scalar(
        select(User)
        .where(User.id == user_id)
        .options(
            selectinload(User.profile),
            selectinload(User.permissions),
            selectinload(User.memberships).selectinload(Membership.community),
            selectinload(User.agent).selectinload(AgentPersona.memories),
        )
    )


def apply_profile_update(profile: Profile, payload: ProfileUpdate) -> None:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)


def apply_permission_update(permissions: Permissions, payload: PermissionUpdate) -> None:
    for key, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(permissions, key, value)


def apply_agent_update(agent: AgentPersona, payload: AgentUpdate) -> None:
    data = payload.model_dump(exclude_unset=True)
    memory = data.pop("memory", None)
    for key, value in data.items():
        if value is not None:
            setattr(agent, key, value)
    if memory is not None:
        agent.memories.clear()
        agent.memories.extend(AgentMemory(text=item) for item in memory)


async def apply_onboarding(session: AsyncSession, user: User, payload: OnboardingRequest) -> User:
    loaded = await get_user_graph(session, user.id)
    if loaded is None:
        raise ValueError("User not found")
    apply_profile_update(loaded.profile, payload.profile)
    apply_agent_update(loaded.agent, payload.agent)
    apply_permission_update(loaded.permissions, payload.permissions)
    await session.commit()
    refreshed = await get_user_graph(session, user.id)
    if refreshed is None:
        raise ValueError("User not found")
    return refreshed
