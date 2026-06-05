"""LLM access: Instructor + Pydantic structured outputs over Nebius (chat), and
a plain async embeddings client over Nebius (embeddings host).

Instructor gives the spec's typed/validated/auto-retried structured calls. We use
JSON mode (not tool-calling) for broad compatibility with Nebius-hosted models.
Chat and embeddings use different Nebius base URLs.
"""
import instructor
from openai import AsyncOpenAI

from .config import settings

_chat = instructor.from_openai(
    AsyncOpenAI(base_url=settings.openai_base_url, api_key=settings.nebius_api_key),
    mode=instructor.Mode.JSON,
)
_embed = AsyncOpenAI(base_url=settings.openai_embed_base_url, api_key=settings.nebius_api_key)


async def structured(response_model, system: str, user: str, *, model: str | None = None, max_retries: int = 2):
    """Typed LLM call — Instructor validates against `response_model` and retries."""
    return await _chat.chat.completions.create(
        model=model or settings.openai_model,
        response_model=response_model,
        max_retries=max_retries,
        temperature=0.4,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )


async def embed(text: str) -> list[float]:
    resp = await _embed.embeddings.create(model=settings.openai_embed_model, input=text)
    return resp.data[0].embedding
