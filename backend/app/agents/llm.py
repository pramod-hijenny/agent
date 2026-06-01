from langchain_openai import ChatOpenAI

from app.core.config import get_settings


def get_openai_chat_model() -> ChatOpenAI | None:
    settings = get_settings()
    if not settings.openai_api_key or not settings.openai_model:
        return None
    return ChatOpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        model=settings.openai_model,
        temperature=0.4,
        timeout=settings.openai_timeout_seconds,
        max_retries=1,
    )
