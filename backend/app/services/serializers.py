from app.models import AgentPersona, Community, Membership, Permissions, Profile
from app.schemas import AgentRead, CommunityRead, MembershipRead, PermissionRead, ProfileRead


def serialize_community(row: Community | None) -> CommunityRead | None:
    if row is None:
        return None
    return CommunityRead(
        id=row.id,
        name=row.name,
        type=row.type,
        city=row.city,
        description=row.description,
    )


def serialize_membership(row: Membership, include_community: bool = True) -> MembershipRead:
    return MembershipRead(
        id=row.id,
        user_id=row.user_id,
        community_id=row.community_id,
        role=row.role,
        community=serialize_community(getattr(row, "community", None)) if include_community else None,
    )


def serialize_permissions(row: Permissions | None) -> PermissionRead | None:
    if row is None:
        return None
    return PermissionRead(
        can_talk_to_agents=row.can_talk_to_agents,
        can_recommend_people=row.can_recommend_people,
        can_draft_messages=row.can_draft_messages,
        can_send_without_approval=row.can_send_without_approval,
        can_share_phone=row.can_share_phone,
        can_share_email=row.can_share_email,
        can_schedule_meetings=row.can_schedule_meetings,
        can_discuss_finances=row.can_discuss_finances,
        can_discuss_professional=row.can_discuss_professional,
    )


def serialize_agent(row: AgentPersona | None) -> AgentRead | None:
    if row is None:
        return None
    return AgentRead(
        agent_name=row.agent_name,
        tone=row.tone,
        agent_intro=row.agent_intro,
        current_mission=row.current_mission,
        status=row.status.value if hasattr(row.status, "value") else str(row.status),
        memory=[memory.text for memory in row.memories],
    )


def serialize_profile(row: Profile, include_agent: bool = True) -> ProfileRead:
    user = row.user
    return ProfileRead(
        id=row.id,
        user_id=row.user_id,
        community_id=row.community_id,
        full_name=row.full_name,
        city=row.city,
        profession=row.profession,
        company=row.company,
        role=row.role,
        stage=row.stage,
        bio=row.bio,
        avatar_color=row.avatar_color,
        interests=row.interests,
        skills=row.skills,
        goals=row.goals,
        current_ask=row.current_ask,
        offering=row.offering,
        availability=row.availability,
        likes=row.likes,
        dislikes=row.dislikes,
        topics_enjoy=row.topics_enjoy,
        topics_avoid=row.topics_avoid,
        agent=serialize_agent(user.agent) if include_agent and user else None,
        permissions=serialize_permissions(user.permissions) if include_agent and user else None,
    )
