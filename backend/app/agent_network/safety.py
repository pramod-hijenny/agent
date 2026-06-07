"""Safety helpers for autonomous in-platform agent actions."""
from __future__ import annotations

import re

from pydantic import BaseModel

from ..schemas import SafetyDecision

EMAIL_RE = re.compile(r"\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b", re.I)
PHONE_RE = re.compile(r"(?:\+?\d[\d\s().-]{7,}\d)")
PRIVATE_URL_RE = re.compile(
    r"\b(?:https?://)?(?:calendly\.com|calendar\.google\.com|stripe\.com|paypal\.com|venmo\.com|cash\.app|wise\.com|zoom\.us)/\S*",
    re.I,
)
SECRET_RE = re.compile(r"\b(?:password|passcode|api[_ -]?key|secret|seed phrase|private key|credential)s?\b", re.I)


class SafetyResult(BaseModel):
    status: str
    reason: str = ""
    redacted_text: str = ""

    @property
    def held(self) -> bool:
        return self.status == "hold"

    def model_dump_for_db(self) -> dict:
        return {"status": self.status, "reason": self.reason, "redacted_text": self.redacted_text}


def redact_private_data(text: str) -> str:
    redacted = EMAIL_RE.sub("[email held for approval]", text)
    redacted = PHONE_RE.sub("[phone held for approval]", redacted)
    redacted = PRIVATE_URL_RE.sub("[off-platform link held for approval]", redacted)
    return redacted


def screen_text(text: str) -> SafetyResult:
    """Deterministic preflight for private/off-platform data.

    The product allows autonomous in-platform agent activity, but private contact
    data and off-platform actions still need human approval.
    """
    reasons: list[str] = []
    if EMAIL_RE.search(text):
        reasons.append("email address")
    if PHONE_RE.search(text):
        reasons.append("phone number")
    if PRIVATE_URL_RE.search(text):
        reasons.append("off-platform scheduling or payment link")
    if SECRET_RE.search(text):
        reasons.append("credential or secret request")

    redacted = redact_private_data(text)
    if reasons:
        return SafetyResult(
            status="hold",
            reason="Requires human approval before sharing " + ", ".join(reasons) + ".",
            redacted_text=redacted,
        )
    return SafetyResult(status="clear", redacted_text=redacted)


def to_decision(result: SafetyResult) -> SafetyDecision:
    return SafetyDecision(status=result.status, reason=result.reason, redacted_text=result.redacted_text)
