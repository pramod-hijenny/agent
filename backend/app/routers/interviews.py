"""Interview (hiring use case) — the only multi-turn agent loop, built with
**Pydantic AI** (spec §9). The hiring agent asks the candidate agent a bounded
set of skill/fit questions; the transcript + structured scores are persisted to
`interviews`. Hard-capped and fully logged.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from pydantic_ai import Agent

from .. import insforge, llm
from ..auth import get_current_user
from ..config import settings
from ..pai import nebius_model
from ..schemas import InterviewScores

router = APIRouter(prefix="/interviews", tags=["interview"])

HARD_CAP = 6
_SVC = settings.insforge_api_key


class InterviewRequest(BaseModel):
    candidate_agent_id: str
    topic: str = "general fit"
    max_questions: int = 4


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _score(transcript: list[dict], topic: str) -> dict:
    """Structured scores. Prefer Pydantic AI; fall back to the proven Instructor path."""
    try:
        scorer = Agent(
            nebius_model(),
            output_type=InterviewScores,
            system_prompt=(
                "Score the candidate from the interview transcript. Return overall (0-100), "
                "per-dimension scores, a recommendation (strong|maybe|pass), and a short rationale."
            ),
        )
        res = await scorer.run(f"Role/topic: {topic}\nTranscript: {transcript}")
        return res.output.model_dump()
    except Exception:  # noqa: BLE001 — fall back to Instructor (JSON mode, verified on Nebius)
        scores = await llm.structured(
            InterviewScores,
            system="Score the candidate from the transcript. Return JSON {overall, dimensions, recommendation, rationale}.",
            user=f"Role/topic: {topic}\nTranscript: {transcript}",
        )
        return scores.model_dump()


async def run_interview_loop(candidate: dict, topic: str, max_questions: int) -> tuple[list[dict], dict]:
    """Bounded hiring↔candidate Q&A via Pydantic AI, then structured scoring."""
    n = max(1, min(max_questions or 4, HARD_CAP))
    model = nebius_model()
    interviewer = Agent(
        model,
        system_prompt=(
            "You are a hiring agent interviewing a candidate's representative. Ask ONE concise, "
            "specific skill/fit question at a time. Output only the question — no preamble."
        ),
    )
    answerer = Agent(
        model,
        system_prompt=(
            f"You represent the candidate '{candidate.get('name', 'the candidate')}'. Answer interview "
            f"questions concisely and honestly from their profile. Output only the answer."
        ),
    )
    profile = (
        f"name={candidate.get('name')}, skills={candidate.get('skills')}, "
        f"interests={candidate.get('interests')}, mission={candidate.get('mission')}"
    )
    transcript: list[dict] = []
    for _ in range(n):
        q = (await interviewer.run(f"Role/topic: {topic}\nSo far: {transcript}\nNext question:")).output
        a = (await answerer.run(f"Candidate profile: {profile}\nQuestion: {q}")).output
        transcript.append({"question": q.strip(), "candidate_answer": a.strip()})
    scores = await _score(transcript, topic)
    return transcript, scores


async def _agent_by_user(user_id: str, token: str) -> dict | None:
    rows = await insforge.select(
        "agents", {"user_id": f"eq.{user_id}", "select": "id,name", "limit": "1"}, token
    )
    return rows[0] if rows else None


async def _agent_by_id(agent_id: str, token: str) -> dict | None:
    rows = await insforge.select(
        "agents",
        {"id": f"eq.{agent_id}", "select": "id,name,skills,interests,mission", "limit": "1"},
        token,
    )
    return rows[0] if rows else None


@router.post("")
async def run_interview(body: InterviewRequest, user: dict = Depends(get_current_user)):
    hiring = await _agent_by_user(user["id"], user["token"])
    if not hiring:
        raise HTTPException(status_code=404, detail="Register your agent first")
    candidate = await _agent_by_id(body.candidate_agent_id, user["token"])
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate agent not found")

    created = await insforge.insert(
        "interviews",
        [{"hiring_agent_id": hiring["id"], "candidate_agent_id": candidate["id"], "state": "in_progress"}],
        user["token"],
    )
    interview_id = created[0]["id"] if created else None

    try:
        transcript, scores = await run_interview_loop(candidate, body.topic, body.max_questions)
        patch = {"transcript": transcript, "scores": scores, "state": "completed", "updated_at": _now()}
    except Exception as e:  # noqa: BLE001 — leave a partial/abandoned record, never 500 the caller
        patch = {"state": "abandoned", "scores": {"error": str(e)[:300]}, "updated_at": _now()}

    if interview_id:
        await insforge.update("interviews", {"id": f"eq.{interview_id}"}, patch, user["token"])
    return {"interview": {"id": interview_id, **patch}}
