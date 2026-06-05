"""Pillar 3+4 — Interaction + Trust. The message state machine:

    requested → screened → approved → delivered
                         ↘ declined

- create:  sender creates a message (state=requested); if the sender's agent mode
  is on, the LLM drafts it for human approval first.
- approve: sender approves their outbound; the recipient's Trust check runs
  (allowlist → recipient-mode-off → LLM screen vs agent_rules). pass→approved
  (+screening_log, notify-able); decline→declined (+screening_log, persona-tone
  auto-decline to sender; recipient is NOT notified).
- deliver: recipient accepts an approved message → delivered, reputation bumps.

Cross-actor transitions (the recipient's screening triggered by the sender) run
with the InsForge service key — the backend enforces authorization itself.
"""
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .. import insforge, llm
from ..auth import get_current_user
from ..config import settings
from ..schemas import IntroDraft, ScreeningDecision

router = APIRouter(prefix="/messages", tags=["interaction"])

_SVC = settings.insforge_api_key  # service key — privileged, RLS-bypassing writes


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class CreateMessage(BaseModel):
    to_agent_id: str
    kind: Literal["intro", "dm"] = "dm"
    body: str | None = None
    context: dict = {}


class ApproveMessage(BaseModel):
    edited_body: str | None = None


# ── Pure trust decision (unit-tested; LLM result injected) ───────────────────
def decide_screening(
    allowlist_hit: bool,
    recipient_mode_enabled: bool,
    llm_decision: ScreeningDecision | None,
) -> tuple[str, str, bool]:
    """Returns (next_state, reason, write_screening_log)."""
    if allowlist_hit:
        return "approved", "Allowlisted sender — passed without screening.", True
    if not recipient_mode_enabled:
        return "approved", "Recipient agent mode off — delivered directly.", False
    if llm_decision is None:  # defensive: treat as decline if screening didn't run
        return "declined", "Screening unavailable.", True
    if llm_decision.decision == "pass":
        return "approved", llm_decision.reason, True
    return "declined", llm_decision.reason, True


async def _agent_by_user(user_id: str, token: str) -> dict | None:
    rows = await insforge.select(
        "agents",
        {"user_id": f"eq.{user_id}", "select": "id,user_id,name,persona_tone,agent_mode_enabled", "limit": "1"},
        token,
    )
    return rows[0] if rows else None


async def _agent_by_id(agent_id: str, token: str) -> dict | None:
    rows = await insforge.select(
        "agents",
        {"id": f"eq.{agent_id}", "select": "id,user_id,name,persona_tone,agent_mode_enabled", "limit": "1"},
        token,
    )
    return rows[0] if rows else None


@router.post("")
async def create_message(body: CreateMessage, user: dict = Depends(get_current_user)):
    sender = await _agent_by_user(user["id"], user["token"])
    if not sender:
        raise HTTPException(status_code=404, detail="Register your agent first")
    if body.to_agent_id == sender["id"]:
        raise HTTPException(status_code=400, detail="Cannot message your own agent")
    recipient = await _agent_by_id(body.to_agent_id, user["token"])
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient agent not found")

    text = (body.body or "").strip()
    draft_source = "human"
    needs_approval = False
    if sender.get("agent_mode_enabled") and (body.kind == "intro" or not text):
        draft = await llm.structured(
            IntroDraft,
            system=(
                f"You are {sender['name']}, a warm AI social representative. Draft ONE concise "
                f"introduction request under 55 words. Do not imply approval has happened. "
                f"Return JSON {{body}}."
            ),
            user=f"Recipient: {recipient['name']}. Context: {body.context}. Original note: {text or '(none)'}",
        )
        text = draft.body
        draft_source = "llm"
        needs_approval = True

    row = {
        "from_agent_id": sender["id"],
        "to_agent_id": body.to_agent_id,
        "kind": body.kind,
        "body": text,
        "context": body.context,
        "state": "requested",
    }
    saved = await insforge.insert("messages", [row], user["token"])  # RLS: sender insert, state=requested
    return {"message": saved[0] if saved else None, "draft_source": draft_source, "needs_approval": needs_approval}


@router.post("/{message_id}/approve")
async def approve_message(message_id: str, body: ApproveMessage, user: dict = Depends(get_current_user)):
    rows = await insforge.select("messages", {"id": f"eq.{message_id}", "select": "*", "limit": "1"}, _SVC)
    if not rows:
        raise HTTPException(status_code=404, detail="Message not found")
    msg = rows[0]
    sender = await _agent_by_user(user["id"], user["token"])
    if not sender or msg["from_agent_id"] != sender["id"]:
        raise HTTPException(status_code=403, detail="Only the sender can approve this message")
    if msg["state"] != "requested":
        raise HTTPException(status_code=409, detail=f"Message is already '{msg['state']}'")

    final_body = (body.edited_body or msg["body"]).strip()
    recipient = await _agent_by_id(msg["to_agent_id"], _SVC)

    # Recipient trust inputs (owner-only tables → service key).
    allow = await insforge.select(
        "allowlist",
        {"agent_id": f"eq.{msg['to_agent_id']}", "allowed_user_id": f"eq.{user['id']}", "select": "agent_id"},
        _SVC,
    )
    allowlist_hit = bool(allow)
    recipient_mode = bool(recipient and recipient.get("agent_mode_enabled"))

    llm_decision: ScreeningDecision | None = None
    model_used = ""
    if recipient_mode and not allowlist_hit:
        rules = await insforge.select(
            "agent_rules", {"agent_id": f"eq.{msg['to_agent_id']}", "select": "rule_text,action"}, _SVC
        )
        rule_lines = "\n".join(f"- {r['rule_text']} (action: {r['action']})" for r in rules) or "- (no custom rules)"
        llm_decision = await llm.structured(
            ScreeningDecision,
            system=(
                f"You screen inbound messages for {recipient['name']}. Decline scams, spam, "
                f"payment/credential asks, and anything off-policy; pass useful, specific, professional "
                f"asks. Recipient rules:\n{rule_lines}\nReturn JSON {{decision, reason}}."
            ),
            user=f"Inbound message: {final_body}",
        )
        model_used = settings.openai_model

    next_state, reason, write_log = decide_screening(allowlist_hit, recipient_mode, llm_decision)

    patch: dict = {"body": final_body, "state": next_state, "updated_at": _now()}
    if next_state == "declined":
        patch["decline_reason"] = reason
        # Persona-tone auto-decline back to the sender (recipient is not notified).
        tone = (recipient.get("persona_tone") if recipient else "Friendly") or "Friendly"
        patch["context"] = {
            **(msg.get("context") or {}),
            "auto_decline": f"[{tone}] {recipient['name']} isn't taking this right now — {reason}",
        }
    await insforge.update("messages", {"id": f"eq.{message_id}"}, patch, _SVC)

    if write_log:
        await insforge.insert(
            "screening_log",
            [{"message_id": message_id, "decision": "pass" if next_state == "approved" else "decline",
              "reason": reason, "model": model_used}],
            _SVC,
        )

    return {
        "message_id": message_id,
        "outcome": next_state,
        "reason": reason,
        "screening": llm_decision.model_dump() if llm_decision else None,
    }


@router.post("/{message_id}/deliver")
async def deliver_message(message_id: str, user: dict = Depends(get_current_user)):
    rows = await insforge.select("messages", {"id": f"eq.{message_id}", "select": "*", "limit": "1"}, _SVC)
    if not rows:
        raise HTTPException(status_code=404, detail="Message not found")
    msg = rows[0]
    recipient = await _agent_by_user(user["id"], user["token"])
    if not recipient or msg["to_agent_id"] != recipient["id"]:
        raise HTTPException(status_code=403, detail="Only the recipient can deliver this message")
    if msg["state"] != "approved":
        raise HTTPException(status_code=409, detail=f"Message is '{msg['state']}', not 'approved'")

    await insforge.update("messages", {"id": f"eq.{message_id}"}, {"state": "delivered", "updated_at": _now()}, _SVC)
    # Reputation: both sides benefit from a completed, accepted intro.
    try:
        await insforge.rpc("bump_reputation", {"p_agent_id": msg["from_agent_id"], "p_delta": 2, "p_signal": "intro_delivered"}, _SVC)
        await insforge.rpc("bump_reputation", {"p_agent_id": msg["to_agent_id"], "p_delta": 1, "p_signal": "intro_received"}, _SVC)
    except Exception:  # noqa: BLE001 — reputation is best-effort
        pass
    return {"message_id": message_id, "state": "delivered"}
