"""Runtime configuration, read from environment (InsForge compute --env / local .env).

LLM/Nebius and InsForge credentials are injected as compute-service env vars at
deploy time — they are NOT in the frontend .env. Chat and embeddings live on
different Nebius hosts, hence two base URLs.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    # InsForge data layer (REST + service key for privileged ops)
    insforge_base_url: str = "https://mep6b952.us-east.insforge.app"
    insforge_api_key: str = ""  # service/admin key; used only for privileged operations

    # Nebius — chat (draft + screen)
    nebius_api_key: str = ""
    openai_base_url: str = "https://api.tokenfactory.us-central1.nebius.com/v1/"
    openai_model: str = "moonshotai/Kimi-K2.6"

    # Nebius — embeddings (discovery); different host than chat
    openai_embed_base_url: str = "https://api.tokenfactory.nebius.com/v1/"
    openai_embed_model: str = "Qwen/Qwen3-Embedding-8B"
    embed_dim: int = 4096

    frontend_origin: str = "http://localhost:5173"


settings = Settings()
