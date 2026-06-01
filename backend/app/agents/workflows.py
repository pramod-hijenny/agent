import logging
from typing import TypedDict

from langchain.agents import create_agent

from app.agents.llm import get_openai_chat_model

logger = logging.getLogger(__name__)


class AgentWorkflowState(TypedDict, total=False):
    user_id: str
    workflow: str
    query: str
    profile: dict
    permissions: dict
    candidates: list[dict]
    matches: list[dict]
    draft_message: str
    approved: bool
    persona_prompt: str
    memory: list[str]
    logs: list[str]
    draft_source: str
    llm_error: str
    __interrupt__: list[dict]


class IntroDraftResult(TypedDict):
    message: str
    draft_source: str
    llm_error: str


_RUN_MEMORY: dict[str, AgentWorkflowState] = {}


def build_persona_prompt(profile: dict, permissions: dict, memory: list[str]) -> str:
    agent = profile.get("agent") or {}
    allowed = [
        key.replace("can_", "").replace("_", " ")
        for key, value in permissions.items()
        if value is True
    ]
    blocked = [
        key.replace("can_", "").replace("_", " ")
        for key, value in permissions.items()
        if value is False
    ]
    memory_block = "\n".join(f"- {item}" for item in memory) or "- No stored memories yet."
    return (
        f"You are {agent.get('agent_name', 'AgentCircle Agent')}, an AI social representative "
        f"for {profile.get('full_name', 'this member')}.\n"
        f"Tone: {agent.get('tone', 'Warm')}.\n"
        f"Mission: {agent.get('current_mission', 'Find compatible people to meet')}.\n"
        f"Intro boundary: {agent.get('agent_intro', 'Represent the user honestly and briefly')}.\n\n"
        "Stored memory:\n"
        f"{memory_block}\n\n"
        f"Allowed capabilities: {', '.join(allowed) or 'none'}.\n"
        f"Blocked capabilities: {', '.join(blocked) or 'none'}.\n\n"
        "Rules: never impersonate the human, never share contact details without explicit "
        "permission, and draft introductions for human approval rather than sending them."
    )


def load_memory(profile: dict) -> list[str]:
    agent = profile.get("agent") or {}
    memory = agent.get("memory") or []
    return [str(item) for item in memory if str(item).strip()]


def score_candidates(state: AgentWorkflowState) -> list[dict]:
    profile = state.get("profile", {})
    candidates = state.get("candidates", [])
    query = state.get("query", "").lower()
    profile_interests = {str(item).lower() for item in profile.get("interests", [])}
    profile_goals = {str(item).lower() for item in profile.get("goals", [])}
    matches = []

    for candidate in candidates:
        candidate_interests = {str(item).lower() for item in candidate.get("interests", [])}
        candidate_goals = {str(item).lower() for item in candidate.get("goals", [])}
        shared_interests = sorted(profile_interests & candidate_interests)
        shared_goals = sorted(profile_goals & candidate_goals)
        score = 40 + len(shared_interests) * 8 + len(shared_goals) * 6
        reasons = []

        if shared_interests:
            reasons.append(f"Shared interests: {', '.join(shared_interests[:3])}")
        if shared_goals:
            reasons.append(f"Shared goals: {', '.join(shared_goals[:3])}")
        if candidate.get("city", "").lower() and candidate.get("city", "").lower() in query:
            score += 15
            reasons.append("City matches request")
        if not reasons:
            reasons.append("Open to compatible introductions")

        matches.append({"profile": candidate, "score": min(score, 99), "reasons": reasons})

    matches.sort(key=lambda item: item["score"], reverse=True)
    return matches[:10]


def draft_intro_with_langchain(
    profile: dict,
    target: dict,
    persona_prompt: str,
    fallback_message: str,
) -> IntroDraftResult:
    model = get_openai_chat_model()
    if not model:
        return {
            "message": fallback_message,
            "draft_source": "fallback",
            "llm_error": "OPENAI_API_KEY or OPENAI_MODEL is not configured",
        }

    try:
        agent = create_agent(model=model, tools=[], system_prompt=persona_prompt)
        result = agent.invoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": (
                            "Draft one concise, warm introduction request under 55 words.\n\n"
                            f"Sender profile: {profile}\n\n"
                            f"Target profile: {target}\n\n"
                            "Do not imply either human has already approved the intro."
                        ),
                    }
                ]
            }
        )
        messages = result.get("messages", [])
        if not messages:
            return {
                "message": fallback_message,
                "draft_source": "fallback",
                "llm_error": "LangChain agent returned no messages",
            }
        content = getattr(messages[-1], "content", "")
        message = str(content).strip()
        if message:
            return {"message": message, "draft_source": "llm", "llm_error": ""}
        return {
            "message": fallback_message,
            "draft_source": "fallback",
            "llm_error": "LangChain agent returned an empty message",
        }
    except Exception as exc:
        logger.exception("LangChain intro draft failed")
        return {
            "message": fallback_message,
            "draft_source": "fallback",
            "llm_error": str(exc),
        }


def draft_intro(state: AgentWorkflowState, persona_prompt: str) -> IntroDraftResult:
    permissions = state.get("permissions", {})
    if not permissions.get("can_draft_messages", True):
        return {"message": "", "draft_source": "disabled", "llm_error": ""}

    matches = state.get("matches", [])
    if not matches:
        return {"message": "", "draft_source": "none", "llm_error": ""}

    profile = state.get("profile", {})
    target = matches[0]["profile"]
    shared = ", ".join(target.get("interests", [])[:2]) or "similar goals"
    fallback_message = (
        f"Hi {target.get('full_name', 'there')}, my agent thought we might have a good "
        f"conversation around {shared}. Would you be open to an intro?"
    )
    return draft_intro_with_langchain(profile, target, persona_prompt, fallback_message)


def generate_agent_reply(state: AgentWorkflowState, message: str) -> IntroDraftResult:
    profile = state.get("profile", {})
    persona_prompt = build_persona_prompt(
        profile,
        state.get("permissions", {}),
        load_memory(profile),
    )
    model = get_openai_chat_model()
    fallback = (
        "I can help with matching, intro drafts, and privacy-safe recommendations once the "
        "agent model is available."
    )
    if not model:
        return {
            "message": fallback,
            "draft_source": "fallback",
            "llm_error": "OPENAI_API_KEY or OPENAI_MODEL is not configured",
        }
    try:
        agent = create_agent(model=model, tools=[], system_prompt=persona_prompt)
        result = agent.invoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": (
                            "Answer as the user's social representative in under 80 words. "
                            "Do not claim to send messages or share contact details.\n\n"
                            f"User message: {message}"
                        ),
                    }
                ]
            }
        )
        messages = result.get("messages", [])
        content = str(getattr(messages[-1], "content", "")).strip() if messages else ""
        if content:
            return {"message": content, "draft_source": "llm", "llm_error": ""}
        return {
            "message": fallback,
            "draft_source": "fallback",
            "llm_error": "LangChain agent returned an empty message",
        }
    except Exception as exc:
        logger.exception("LangChain agent test reply failed")
        return {"message": fallback, "draft_source": "fallback", "llm_error": str(exc)}


def start_agent_workflow(thread_id: str, state: AgentWorkflowState) -> AgentWorkflowState:
    memory = load_memory(state.get("profile", {}))
    persona_prompt = build_persona_prompt(
        state.get("profile", {}),
        state.get("permissions", {}),
        memory,
    )
    matches = score_candidates(state)
    next_state: AgentWorkflowState = {
        **state,
        "memory": memory,
        "persona_prompt": persona_prompt,
        "matches": matches,
        "logs": [
            "loaded persona and memory",
            "scored candidates",
        ],
    }
    draft = draft_intro(next_state, persona_prompt)
    draft_message = draft["message"]
    next_state["draft_message"] = draft_message
    next_state["draft_source"] = draft["draft_source"]
    next_state["llm_error"] = draft["llm_error"]

    if draft_message:
        next_state["logs"] = [*next_state["logs"], "drafted intro for human approval"]
        next_state["__interrupt__"] = [
            {
                "action": "review_intro",
                "draft_message": draft_message,
                "matches": matches,
            }
        ]
    else:
        next_state["logs"] = [*next_state["logs"], "no draft created"]

    _RUN_MEMORY[thread_id] = next_state
    return next_state


def resume_agent_workflow(
    thread_id: str,
    decision: dict,
    stored_state: AgentWorkflowState | None = None,
) -> AgentWorkflowState:
    state = _RUN_MEMORY.get(thread_id) or stored_state or {}
    approved = bool(decision.get("approved"))
    edited_message = decision.get("edited_message") or state.get("draft_message", "")
    updated: AgentWorkflowState = {
        **state,
        "approved": approved,
        "draft_message": edited_message,
        "logs": [
            *state.get("logs", []),
            "human approved intro" if approved else "human rejected intro",
            f"finalized workflow {thread_id}",
        ],
    }
    updated.pop("__interrupt__", None)
    _RUN_MEMORY[thread_id] = updated
    return updated
