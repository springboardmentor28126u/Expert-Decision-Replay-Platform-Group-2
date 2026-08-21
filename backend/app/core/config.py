"""
Expert Decision Replay Platform - Configuration Module

Manages all application settings via environment variables using Pydantic Settings.
"""

import logging
import os
from pydantic_settings import BaseSettings
from typing import List

logger = logging.getLogger("expert_decision")


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "Expert Decision Replay Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://postgres:localhost:5432/expert_decision"
    DATABASE_URL_LOCAL: str = "postgresql://postgres:localhost:5432/expert_decision"

    # JWT - No defaults for production; must be set via environment
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    def model_post_init(self, __context) -> None:
        if not self.SECRET_KEY:
            if self.DEBUG:
                # Generate a random key for development only
                self.SECRET_KEY = os.urandom(32).hex()
                logger.warning(
                    "DEBUG MODE: Generated random SECRET_KEY. "
                    "Set SECRET_KEY environment variable for production."
                )
            else:
                raise ValueError(
                    "SECRET_KEY environment variable is required in production. "
                    "Set it in your .env file or environment."
                )
        if not self.DATABASE_URL or "localhost" in self.DATABASE_URL:
            if not self.DEBUG:
                logger.warning(
                    "SECURITY WARNING: DATABASE_URL points to localhost in production. "
                    "Set DATABASE_URL environment variable."
                )

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
