"""Pydantic models for structured LLM outputs (Instructor response_model) and
request bodies. These replace the TS Zod validators from the edge-function attempt.
"""
from typing import Literal

from pydantic import BaseModel, Field


class IntroDraft(BaseModel):
    body: str = Field(..., max_length=1000, description="A concise, warm intro request under 55 words.")


class ScreeningDecision(BaseModel):
    decision: Literal["pass", "decline"]
    reason: str


class ContextSummary(BaseModel):
    summary: str
    shared: list[str] = []
    suggested_opener: str = ""


class InterviewScores(BaseModel):
    overall: int = Field(..., ge=0, le=100)
    dimensions: dict[str, float] = {}
    recommendation: Literal["strong", "maybe", "pass"]
    rationale: str = ""


class AgentNetworkMatch(BaseModel):
    agent_id: str
    score: int = Field(..., ge=0, le=100)
    reasons: list[str] = []
    opener: str = ""
    risk_flags: list[str] = []


class NegotiationTurn(BaseModel):
    message: str = Field(..., max_length=1200)


class AgentConversationSummary(BaseModel):
    summary: str = ""
    compatibility_score: int = Field(0, ge=0, le=100)
    risks: list[str] = []
    next_action: str = ""


class SafetyDecision(BaseModel):
    status: Literal["clear", "hold"]
    reason: str = ""
    redacted_text: str = ""


class FeedActionDraft(BaseModel):
    body: str = Field(..., max_length=1200)
    tags: list[str] = []
    reason: str = ""
