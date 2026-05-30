from uuid import uuid4

from app.models import IntroRequest, IntroStatus
from app.services.intros import can_transition_intro


def test_recipient_can_accept_pending_intro() -> None:
    sender_id = uuid4()
    recipient_id = uuid4()
    intro = IntroRequest(
        from_user_id=sender_id,
        to_user_id=recipient_id,
        message="Useful intro?",
        status=IntroStatus.pending,
    )

    assert can_transition_intro(intro, recipient_id, IntroStatus.accepted)
    assert not can_transition_intro(intro, sender_id, IntroStatus.accepted)


def test_sender_can_withdraw_but_not_reject_intro() -> None:
    sender_id = uuid4()
    recipient_id = uuid4()
    intro = IntroRequest(
        from_user_id=sender_id,
        to_user_id=recipient_id,
        message="Useful intro?",
        status=IntroStatus.pending,
    )

    assert can_transition_intro(intro, sender_id, IntroStatus.withdrawn)
    assert not can_transition_intro(intro, sender_id, IntroStatus.rejected)


def test_completed_intro_cannot_transition_again() -> None:
    sender_id = uuid4()
    recipient_id = uuid4()
    intro = IntroRequest(
        from_user_id=sender_id,
        to_user_id=recipient_id,
        message="Useful intro?",
        status=IntroStatus.accepted,
    )

    assert not can_transition_intro(intro, recipient_id, IntroStatus.rejected)
