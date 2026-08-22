import os

from dotenv import load_dotenv

# =====================================================
# LOAD ENVIRONMENT VARIABLES
# =====================================================

load_dotenv()


# =====================================================
# APPLICATION
# =====================================================

APP_NAME = os.getenv(
    "APP_NAME",
    "Expert Decision Replay Platform"
)


# =====================================================
# DATABASE
# =====================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    ""
)


# =====================================================
# JWT AUTHENTICATION
# =====================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    ""
)

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "30"
    )
)


# =====================================================
# EMAIL / SMTP
# =====================================================

EMAIL_ENABLED = os.getenv(
    "EMAIL_ENABLED",
    "false"
).lower() == "true"


SMTP_HOST = os.getenv(
    "SMTP_HOST",
    "smtp.gmail.com"
)


SMTP_PORT = int(
    os.getenv(
        "SMTP_PORT",
        "587"
    )
)


SMTP_USERNAME = os.getenv(
    "SMTP_USERNAME",
    ""
)


SMTP_PASSWORD = os.getenv(
    "SMTP_PASSWORD",
    ""
)


SMTP_FROM_EMAIL = os.getenv(
    "SMTP_FROM_EMAIL",
    SMTP_USERNAME
)


SMTP_FROM_NAME = os.getenv(
    "SMTP_FROM_NAME",
    APP_NAME
)
# =====================================================
# AI AGENT / LLM
# =====================================================

AI_ENABLED = os.getenv(
    "AI_ENABLED",
    "false"
).lower() == "true"


AI_PROVIDER = os.getenv(
    "AI_PROVIDER",
    "openai"
)


AI_API_KEY = os.getenv(
    "AI_API_KEY",
    ""
)


AI_MODEL = os.getenv(
    "AI_MODEL",
    ""
)
# =====================================================
# AI / OLLAMA
# =====================================================

AI_ENABLED = os.getenv(
    "AI_ENABLED",
    "true"
).lower() == "true"

AI_MODEL = os.getenv(
    "AI_MODEL",
    "llama3.2:latest"
)

OLLAMA_KEEP_ALIVE = os.getenv(
    "OLLAMA_KEEP_ALIVE",
    "10m"
)