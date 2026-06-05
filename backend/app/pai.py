"""Pydantic AI model wired to Nebius (OpenAI-compatible chat). Used only by the
interview loop — the single multi-turn agent loop in the system (spec §9)."""
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from .config import settings


def nebius_model() -> OpenAIChatModel:
    return OpenAIChatModel(
        settings.openai_model,
        provider=OpenAIProvider(base_url=settings.openai_base_url, api_key=settings.nebius_api_key),
    )
