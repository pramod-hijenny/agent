"""Unit tests for the pure trust-screening decision — all four Agent-Mode scenarios.
The LLM result is injected (no network)."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.routers.messages import decide_screening  # noqa: E402
from app.schemas import ScreeningDecision  # noqa: E402


def test_allowlist_hit_passes_without_llm():
    state, reason, log = decide_screening(True, True, None)
    assert state == "approved" and log is True
    assert "allowlist" in reason.lower()


def test_recipient_mode_off_delivers_directly_no_log():
    # sender-on/recipient-off and sender-off/recipient-off both land here
    state, reason, log = decide_screening(False, False, None)
    assert state == "approved" and log is False


def test_recipient_mode_on_llm_pass():
    d = ScreeningDecision(decision="pass", reason="useful professional ask")
    state, reason, log = decide_screening(False, True, d)
    assert state == "approved" and log is True and reason == "useful professional ask"


def test_recipient_mode_on_llm_decline():
    d = ScreeningDecision(decision="decline", reason="payment scam")
    state, reason, log = decide_screening(False, True, d)
    assert state == "declined" and log is True and reason == "payment scam"


def test_recipient_mode_on_but_no_decision_defaults_declined():
    state, _reason, log = decide_screening(False, True, None)
    assert state == "declined" and log is True
