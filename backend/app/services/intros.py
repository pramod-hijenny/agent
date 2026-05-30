from uuid import UUID

from app.models import IntroRequest, IntroStatus


def can_transition_intro(intro: IntroRequest, actor_user_id: UUID, next_status: IntroStatus) -> bool:
    if intro.status != IntroStatus.pending:
        return False
    if next_status in {IntroStatus.accepted, IntroStatus.rejected}:
        return actor_user_id == intro.to_user_id
    if next_status == IntroStatus.withdrawn:
        return actor_user_id == intro.from_user_id
    return False
