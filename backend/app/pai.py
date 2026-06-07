"""Pydantic AI model wired to Nebius (OpenAI-compatible chat). Used only by the
interview loop — the single multi-turn agent loop in the system (spec §9)."""
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai import Agent

from .config import settings


def nebius_model() -> OpenAIChatModel:
    return OpenAIChatModel(
        settings.openai_model,
        provider=OpenAIProvider(base_url=settings.openai_base_url, api_key=settings.nebius_api_key),
    )


def make_agent(*, system_prompt: str, output_type=None) -> Agent:
    """Create a Pydantic AI agent on the shared Nebius/OpenAI-compatible model."""
    kwargs = {"system_prompt": system_prompt}
    if output_type is not None:
        kwargs["output_type"] = output_type
    return Agent(nebius_model(), **kwargs)
