from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MagicLinkRequest(BaseModel):
    email: EmailStr


class MagicLinkVerify(BaseModel):
    token: str


class PermissionRead(BaseModel):
    can_talk_to_agents: bool = True
    can_recommend_people: bool = True
    can_draft_messages: bool = True
    can_send_without_approval: bool = False
    can_share_phone: bool = False
    can_share_email: bool = False
    can_schedule_meetings: bool = False
    can_discuss_finances: bool = False
    can_discuss_professional: bool = True


class PermissionUpdate(BaseModel):
    can_talk_to_agents: bool | None = None
    can_recommend_people: bool | None = None
    can_draft_messages: bool | None = None
    can_send_without_approval: bool | None = None
    can_share_phone: bool | None = None
    can_share_email: bool | None = None
    can_schedule_meetings: bool | None = None
    can_discuss_finances: bool | None = None
    can_discuss_professional: bool | None = None


class CommunityRead(BaseModel):
    id: UUID
    name: str
    type: str
    city: str
    description: str


class MembershipRead(BaseModel):
    id: UUID
    user_id: UUID
    community_id: UUID
    role: str
    community: CommunityRead | None = None


class AgentRead(BaseModel):
    agent_name: str
    tone: str
    agent_intro: str
    current_mission: str
    status: str
    memory: list[str] = Field(default_factory=list)


class AgentUpdate(BaseModel):
    agent_name: str | None = None
    tone: str | None = None
    agent_intro: str | None = None
    current_mission: str | None = None
    status: str | None = None
    memory: list[str] | None = None


class ProfileRead(BaseModel):
    id: UUID
    user_id: UUID
    community_id: UUID | None = None
    full_name: str
    city: str
    profession: str
    company: str
    role: str
    stage: str
    bio: str
    avatar_color: str
    interests: list[str]
    skills: list[str]
    goals: list[str]
    current_ask: str
    offering: str
    availability: str
    likes: str
    dislikes: str
    topics_enjoy: str
    topics_avoid: str
    agent: AgentRead | None = None
    permissions: PermissionRead | None = None


class ProfileUpdate(BaseModel):
    community_id: UUID | None = None
    full_name: str | None = None
    city: str | None = None
    profession: str | None = None
    company: str | None = None
    role: str | None = None
    stage: str | None = None
    bio: str | None = None
    avatar_color: str | None = None
    interests: list[str] | None = None
    skills: list[str] | None = None
    goals: list[str] | None = None
    current_ask: str | None = None
    offering: str | None = None
    availability: str | None = None
    likes: str | None = None
    dislikes: str | None = None
    topics_enjoy: str | None = None
    topics_avoid: str | None = None


class OnboardingRequest(BaseModel):
    profile: ProfileUpdate
    agent: AgentUpdate = Field(default_factory=AgentUpdate)
    permissions: PermissionUpdate = Field(default_factory=PermissionUpdate)


class UserRead(BaseModel):
    id: UUID
    email: EmailStr
    profile: ProfileRead | None = None


class DiscoverRequest(BaseModel):
    query: str
    city: str = ""
    goal: str = "any"
    limit: int = Field(default=3, ge=1, le=20)


class MatchRead(BaseModel):
    profile: ProfileRead
    score: int
    reasons: list[str]
    suggested_activity: str


class IntroCreate(BaseModel):
    to_user_id: UUID
    message: str = Field(min_length=1, max_length=4000)
    transcript: list[dict] = Field(default_factory=list)
    summary: dict = Field(default_factory=dict)


class IntroUpdate(BaseModel):
    status: str


class IntroRead(BaseModel):
    id: UUID
    from_user_id: UUID
    to_user_id: UUID
    message: str
    status: str
    transcript: list[dict]
    summary: dict
    created_at: datetime


class ConversationCreate(BaseModel):
    participant_user_ids: list[UUID]
    title: str = ""


class ConversationRead(BaseModel):
    id: UUID
    title: str
    created_at: datetime


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)
    sender: str = "user"


class MessageRead(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_user_id: UUID | None
    sender: str
    body: str
    created_at: datetime


class AgentRunRead(BaseModel):
    id: UUID
    workflow: str
    status: str
    thread_id: str
    input: dict
    output: dict
    error: str
    created_at: datetime
    updated_at: datetime


class AgentRunCreate(BaseModel):
    workflow: str = "intro_review"
    thread_id: str
    state: dict


class AgentRunResume(BaseModel):
    decision: dict
