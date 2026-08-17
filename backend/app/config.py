import json
import secrets
from typing import List, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- Application ---------------------------------------------------
    PROJECT_NAME: str = "Expert Decision Replay Platform"
    API_V1_PREFIX: str = "/api/v1"
    API_VERSION: str = "0.1.0"
    ENVIRONMENT: Literal["development", "staging", "production", "test"] = "development"
    DEBUG: bool = False

    # --- Database --------------------------------------------------------
    DATABASE_URL: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    # True by default so existing external Postgres (Neon) behavior is
    # unchanged. Docker Compose overrides this to false for the local
    # Postgres container, which doesn't speak TLS — see database.py.
    DB_SSL_REQUIRE: bool = True

    # --- Security / JWT --------------------------------------------------
    SECRET_KEY: str = secrets.token_urlsafe(64)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- CORS --------------------------------------------------------------
    BACKEND_CORS_ORIGINS: List[str] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, value: str | List[str]) -> List[str]:
        if isinstance(value, str):
            if value.startswith("["):
                parsed = json.loads(value)
                return [str(origin).strip() for origin in parsed]
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key_in_production(cls, value: str, info) -> str:
        if len(value) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long.")
        return value

    # --- Pagination defaults (used by utils/pagination.py) ---------------
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # --- LLM (optional; summarization / NL query fall back to
    # deterministic behavior when unset) ---------------------------------
    GOOGLE_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-flash-lite-latest"

    # Optional secondary provider — automatic fallback when Gemini is
    # rate-limited, unconfigured, or fails. Leave GROQ_API_KEY blank to
    # skip Groq entirely and keep today's Gemini-only behavior; see
    # services/llm_client.py.
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # --- Rate limiting -----------------------------------------------------
    RATE_LIMIT_REQUESTS: int = 60
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # Optional — enables shared/distributed rate limiting across multiple
    # backend processes via Redis. Falls back to in-memory (per-process)
    # rate limiting when unset or unreachable — see middleware/rate_limit.py.
    REDIS_URL: str | None = None

    # --- Email alerts (optional; email sending is skipped with a logged
    # warning when SMTP_HOST/SMTP_FROM_EMAIL are unset — see
    # services/email_service.py) -----------------------------------------
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None
    SMTP_USE_TLS: bool = True

    # Used to build the "view decision" link in emails.
    FRONTEND_BASE_URL: str = "http://localhost:5173"


settings = Settings()  # type: ignore[call-arg]  # DATABASE_URL supplied via env/.env

