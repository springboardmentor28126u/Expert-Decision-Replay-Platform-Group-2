# services/llm_client.py
"""
services/llm_client.py

Thin wrapper around the Gemini generateContent REST API.

Deliberately fail-soft: every failure mode (no API key configured,
network error, timeout, non-200 response, unexpected payload shape)
is caught here and turned into `None` rather than an exception, so
callers (decision_summary_service, nl_query_service) can always fall
back to their deterministic behavior instead of surfacing a 500 to
the user mid-demo.
"""

from __future__ import annotations

import logging

import httpx

from app.config import settings

logger = logging.getLogger("edrp.llm")

_ENDPOINT_TEMPLATE = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)

_TIMEOUT_SECONDS = 8.0


async def generate_text(prompt: str) -> str | None:
    """
    Returns the model's plain-text response, or None if the LLM is
    unavailable/unconfigured/failed for any reason.
    """

    if not settings.GOOGLE_API_KEY:
        return None

    url = _ENDPOINT_TEMPLATE.format(model=settings.GEMINI_MODEL)

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
                "Gemini call failed (status=%s); falling back to deterministic behavior.",
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
        logger.exception("Gemini call raised; falling back to deterministic behavior.")
        return None
