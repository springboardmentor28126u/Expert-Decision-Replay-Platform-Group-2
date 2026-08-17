# services/llm_client.py
"""
services/llm_client.py

Thin wrapper around two LLM providers, tried in order:

  1. Gemini (generateContent REST API) — primary.
  2. Groq (optional) — automatic fallback, tried only when Gemini is
     rate-limited/quota-exhausted, returns an empty/invalid response,
     or fails for any other reason (network error, timeout, non-200
     status).

Deliberately fail-soft end-to-end: every failure mode on both
providers is caught here and turned into `None` rather than an
exception, so callers (decision_summary_service, nl_query_service,
decision_insight_service) can always fall back to their deterministic
behavior instead of surfacing a 500 to the user mid-demo. Groq is
purely an optional second attempt — if GROQ_API_KEY is unset, Groq is
skipped silently and behavior is identical to today's Gemini-only
behavior.

generate_text() keeps its original str|None contract for any caller
that doesn't care which provider answered. generate_text_with_provider()
additionally reports which provider produced the text ("gemini",
"groq", or None if both were unconfigured/failed), for the callers
whose response schemas already track provenance.
"""

from __future__ import annotations

import logging

import httpx
from groq import AsyncGroq

from app.config import settings

logger = logging.getLogger("edrp.llm")

_GEMINI_ENDPOINT_TEMPLATE = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)

_TIMEOUT_SECONDS = 8.0

# Constructed lazily on first use (only when GROQ_API_KEY is set) and
# reused for the lifetime of the process, matching how the Redis
# client is cached in middleware/rate_limit.py.
_groq_client: AsyncGroq | None = None


async def generate_text(prompt: str) -> str | None:
    """
    Returns the model's plain-text response, or None if every
    configured provider is unavailable/unconfigured/failed.
    """

    text, _provider = await generate_text_with_provider(prompt)
    return text


async def generate_text_with_provider(prompt: str) -> tuple[str | None, str | None]:
    """
    Same as generate_text(), but also returns which provider produced
    the text: "gemini", "groq", or None if nothing succeeded.
    """

    text = await _generate_with_gemini(prompt)
    if text is not None:
        return text, "gemini"

    text = await _generate_with_groq(prompt)
    if text is not None:
        return text, "groq"

    return None, None


async def _generate_with_gemini(prompt: str) -> str | None:
    if not settings.GOOGLE_API_KEY:
        return None

    url = _GEMINI_ENDPOINT_TEMPLATE.format(model=settings.GEMINI_MODEL)

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
            response = await client.post(
                url,
                params={"key": settings.GOOGLE_API_KEY},
                json={
                    "contents": [
                        {"parts": [{"text": prompt}]},
                    ],
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 512,
                    },
                },
            )

        if response.status_code != 200:
            logger.warning(
                "Gemini call failed (status=%s); trying Groq fallback.",
                response.status_code,
            )
            return None

        data = response.json()

        candidates = data.get("candidates") or []
        if not candidates:
            return None

        parts = candidates[0].get("content", {}).get("parts") or []
        if not parts:
            return None

        text = parts[0].get("text")
        return text.strip() if text else None

    except Exception:
        logger.exception("Gemini call raised; trying Groq fallback.")
        return None


def _get_groq_client() -> AsyncGroq | None:
    """
    Returns the cached AsyncGroq client, constructing it on first use.
    Returns None if GROQ_API_KEY isn't configured, so callers can skip
    Groq entirely without instantiating anything.
    """

    global _groq_client

    if not settings.GROQ_API_KEY:
        return None

    if _groq_client is None:
        _groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY, timeout=_TIMEOUT_SECONDS)

    return _groq_client


async def _generate_with_groq(prompt: str) -> str | None:
    client = _get_groq_client()
    if client is None:
        return None

    try:
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=512,
        )

        choices = response.choices or []
        if not choices:
            return None

        text = choices[0].message.content
        return text.strip() if text else None

    except Exception:
        logger.exception("Groq fallback call raised; falling back to deterministic behavior.")
        return None
