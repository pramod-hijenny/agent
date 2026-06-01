from fastapi import APIRouter, Request

from app.agents.workflows import (
    build_persona_prompt,
    draft_intro_with_langchain,
    score_candidates,
)
from app.core.config import get_settings

router = APIRouter(tags=["a2a"])


def agent_card(base_url: str) -> dict:
    endpoint = f"{base_url.rstrip('/')}/a2a/v1"
    return {
        "protocolVersion": "1.0",
        "name": "AgentCircle Social Representative",
        "description": (
            "Discovers compatible human connections, compares agent personas, drafts "
            "consent-first introductions, and keeps the user in control of contact sharing."
        ),
        "url": endpoint,
        "version": "0.1.0",
        "provider": {
            "organization": "AgentCircle",
            "url": base_url.rstrip("/"),
        },
        "capabilities": {
            "streaming": False,
            "pushNotifications": False,
            "stateTransitionHistory": True,
            "extendedAgentCard": False,
        },
        "defaultInputModes": ["text/plain", "application/json"],
        "defaultOutputModes": ["text/plain", "application/json"],
        "skills": [
            {
                "id": "persona_match",
                "name": "Persona match",
                "description": "Compares approved personas and returns compatibility reasons.",
                "tags": ["social-discovery", "matching", "persona"],
                "examples": [
                    "Compare Alex Agent with Maya Agent for a San Francisco founder coffee intro."
                ],
                "inputModes": ["application/json"],
                "outputModes": ["application/json"],
            },
            {
                "id": "intro_draft",
                "name": "Consent-first intro draft",
                "description": "Drafts an introduction message for human approval.",
                "tags": ["introductions", "approval", "safety"],
                "examples": [
                    "Draft a warm intro for two users who both like AI and startup conversations."
                ],
                "inputModes": ["application/json"],
                "outputModes": ["application/json", "text/plain"],
            },
        ],
        "supportedInterfaces": [
            {
                "url": endpoint,
                "protocolBinding": "HTTP+JSON",
                "protocolVersion": "1.0",
            }
        ],
    }


@router.get("/.well-known/agent-card.json")
async def read_agent_card() -> dict:
    return agent_card(get_settings().public_base_url)


@router.post("/a2a/v1")
async def handle_a2a(request: Request) -> dict:
    payload = await request.json()
    request_id = payload.get("id")
    method = payload.get("method") or payload.get("skill") or ""
    params = payload.get("params") or payload.get("input") or {}

    try:
        if method in {"persona_match", "skills/persona_match"}:
            result = handle_persona_match(params)
        elif method in {"intro_draft", "skills/intro_draft"}:
            result = handle_intro_draft(params)
        else:
            return json_rpc_error(request_id, -32601, "Unsupported A2A method")
    except Exception as exc:
        return json_rpc_error(request_id, -32000, str(exc))

    if "jsonrpc" in payload:
        return {"jsonrpc": "2.0", "id": request_id, "result": result}
    return result


def handle_persona_match(params: dict) -> dict:
    profile = params.get("profile") or params.get("sender_profile") or {}
    candidates = params.get("candidates") or []
    if not candidates and params.get("target_profile"):
        candidates = [params["target_profile"]]
    matches = score_candidates(
        {
            "profile": profile,
            "candidates": candidates,
            "query": params.get("query", ""),
        }
    )
    return {"matches": matches, "approval_required": True}


def handle_intro_draft(params: dict) -> dict:
    profile = params.get("profile") or params.get("sender_profile") or {}
    target = params.get("target_profile") or params.get("target") or {}
    permissions = params.get("permissions") or {"can_draft_messages": True}
    memory = params.get("memory") or []
    persona_prompt = build_persona_prompt(profile, permissions, memory)
    shared = ", ".join(target.get("interests", [])[:2]) or "similar goals"
    fallback_message = (
        f"Hi {target.get('full_name', 'there')}, my agent thought we might have a good "
        f"conversation around {shared}. Would you be open to an intro?"
    )
    draft = draft_intro_with_langchain(profile, target, persona_prompt, fallback_message)
    return {
        "draft_message": draft["message"],
        "draft_source": draft["draft_source"],
        "llm_error": draft["llm_error"],
        "approval_required": True,
    }


def json_rpc_error(request_id: object, code: int, message: str) -> dict:
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "error": {"code": code, "message": message},
    }
