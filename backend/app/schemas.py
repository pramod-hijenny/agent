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
