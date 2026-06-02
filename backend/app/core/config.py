from functools import lru_cache

from pydantic import AnyUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AgentCircle API"
    app_env: str = "local"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    frontend_origin: str = "http://localhost:5173"

    database_url: str = "postgresql+asyncpg://agentcircle:agentcircle@localhost:5432/agentcircle"
    sync_database_url: str = "postgresql+psycopg://agentcircle:agentcircle@localhost:5432/agentcircle"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = "change-me-local-dev-secret-32-bytes"
    jwt_algorithm: str = "HS256"
    jwt_ttl_seconds: int = 60 * 60 * 24 * 14

    magic_link_secret: str = "change-me-too"
    magic_link_ttl_seconds: int = 900

    mail_from: str = "no-reply@agentcircle.local"
    smtp_host: str = "localhost"
    smtp_port: int = 1025

    openai_api_key: str | None = None
    openai_base_url: str = "https://api.tokenrouter.com/v1"
    openai_model: str = ""
    openai_timeout_seconds: float = 30.0

    insforge_url: str = "https://mep6b952.us-east.insforge.app"

    public_base_url: str = "http://localhost:8000"

    @property
    def cors_origins(self) -> list[str | AnyUrl]:
        return [self.frontend_origin, "http://localhost:3000", "http://127.0.0.1:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
