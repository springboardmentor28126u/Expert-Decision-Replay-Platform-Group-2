# middleware/rate_limit.py
"""
middleware/rate_limit.py

API rate limiter, keyed by authenticated user identity when available,
falling back to client IP for unauthenticated requests.

Two backends, same policy (RATE_LIMIT_REQUESTS per RATE_LIMIT_WINDOW_SECONDS):

  - Redis (optional): an atomic Lua sliding-window script against a
    sorted set, shared across every backend process/replica — used
    whenever REDIS_URL is configured and reachable.
  - In-memory (always available): a per-process fixed-window counter.
    Used whenever REDIS_URL is unset, or whenever a Redis call fails
    for any reason. This is the same implementation this middleware
    used before Redis support existed, so a Redis outage never
    disables rate limiting — it just silently degrades to per-process
    limiting, identical to today's behavior.

A single Redis client is created lazily on first use and reused for
the lifetime of the process (redis.asyncio.Redis pools connections
internally, so this does not open a new connection per request).
close_redis_client() is called from main.py's lifespan shutdown so no
connection is left dangling at process exit.
"""

from __future__ import annotations

import logging
import time
import uuid
from collections import defaultdict

import redis.asyncio as aioredis
from jose import JWTError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import settings
from app.core.security import decode_token

logger = logging.getLogger("edrp.rate_limit")

_SLIDING_WINDOW_SCRIPT = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local current = redis.call('ZCARD', key)

if current < limit then
    redis.call('ZADD', key, now, member)
    redis.call('EXPIRE', key, window)
    return 1
else
    return 0
end
"""

# Module-level so the client is created once and reused across every
# request/middleware dispatch, not per-request. Guarded by
# _redis_init_attempted rather than `_redis is not None` so a
# misconfigured/unreachable REDIS_URL isn't retried on every request.
_redis: "aioredis.Redis | None" = None
_redis_init_attempted = False
_redis_unavailable_warned = False


def _get_redis_client() -> "aioredis.Redis | None":
    global _redis, _redis_init_attempted

    if not settings.REDIS_URL:
        return None

    if not _redis_init_attempted:
        _redis_init_attempted = True
        try:
            _redis = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2.0,
                socket_timeout=2.0,
            )
        except Exception:
            # Malformed REDIS_URL etc. — never let this take the app down.
            logger.exception("Failed to construct Redis client; rate limiting will use in-memory only.")
            _redis = None

    return _redis


async def close_redis_client() -> None:
    """Called from main.py's lifespan shutdown to avoid leaking the
    connection pool. Safe to call even if Redis was never configured."""
    global _redis

    if _redis is not None:
        try:
            await _redis.aclose()
        except Exception:
            logger.exception("Error closing Redis client during shutdown.")
        finally:
            _redis = None


def _mark_redis_unavailable(exc: Exception) -> None:
    """Logs once per outage, not once per request — a downed Redis
    shouldn't spam the logs for as long as it stays down. Never logs
    the exception's string form, since redis-py connection errors can
    include host/port from REDIS_URL."""
    global _redis_unavailable_warned
    if not _redis_unavailable_warned:
        logger.warning(
            "Redis rate limiter unavailable (%s); falling back to "
            "in-memory rate limiting until it recovers.",
            type(exc).__name__,
        )
        _redis_unavailable_warned = True


def _mark_redis_healthy() -> None:
    global _redis_unavailable_warned
    if _redis_unavailable_warned:
        logger.info("Redis rate limiter connection restored.")
        _redis_unavailable_warned = False


class RateLimitMiddleware(BaseHTTPMiddleware):

    def __init__(self, app) -> None:
        super().__init__(app)
        # client_key -> (window_start_monotonic, request_count) — the
        # in-memory fallback path; untouched from the pre-Redis version.
        self._windows: dict[str, tuple[float, int]] = defaultdict(lambda: (0.0, 0))

    async def dispatch(self, request: Request, call_next):

        client_key = self._resolve_client_key(request)

        result = await self._check_redis(client_key)
        if result is None:
            result = self._check_in_memory(client_key)

        allowed, retry_after = result

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limited",
                    "detail": "Too many requests. Please slow down and try again shortly.",
                },
                headers={"Retry-After": str(retry_after)},
            )

        return await call_next(request)

    # --------------------------------------------------
    # Identity
    # --------------------------------------------------

    @staticmethod
    def _resolve_client_key(request: Request) -> str:
        """
        Authenticated requests are keyed by the token's `sub` claim (the
        same user-id claim app/dependencies/auth.py already trusts to
        load the current user) — no new trust decisions are introduced
        here, and no raw email/PII is used as the key. Falls back to
        client IP whenever there's no bearer token, or it doesn't
        decode (expired/malformed/wrong signature) — decode_token is
        reused as-is rather than re-implemented.
        """
        auth_header = request.headers.get("Authorization")

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[len("Bearer "):]
            try:
                payload = decode_token(token)
                subject = payload.get("sub")
                if subject:
                    return f"user:{subject}"
            except JWTError:
                pass

        client_ip = request.client.host if request.client else "unknown"
        return f"ip:{client_ip}"

    # --------------------------------------------------
    # Redis-backed sliding window
    # --------------------------------------------------

    @staticmethod
    async def _check_redis(key: str) -> tuple[bool, int] | None:
        """Returns (allowed, retry_after), or None if Redis is
        unconfigured/unavailable — callers fall back to in-memory."""

        client = _get_redis_client()
        if client is None:
            return None

        try:
            now = time.time()
            window = settings.RATE_LIMIT_WINDOW_SECONDS
            limit = settings.RATE_LIMIT_REQUESTS
            redis_key = f"ratelimit:{key}"
            member = f"{now}:{uuid.uuid4()}"

            allowed = await client.eval(
                _SLIDING_WINDOW_SCRIPT,
                1,
                redis_key,
                now,
                window,
                limit,
                member,
            )

            _mark_redis_healthy()

            if int(allowed) == 1:
                return True, 0
            return False, window

        except Exception as exc:
            _mark_redis_unavailable(exc)
            return None

    # --------------------------------------------------
    # In-memory fixed-window fallback (unchanged from the pre-Redis
    # implementation, just keyed by _resolve_client_key instead of
    # always by IP)
    # --------------------------------------------------

    def _check_in_memory(self, key: str) -> tuple[bool, int]:

        now = time.monotonic()
        window_start, count = self._windows[key]

        if now - window_start >= settings.RATE_LIMIT_WINDOW_SECONDS:
            window_start, count = now, 0

        count += 1
        self._windows[key] = (window_start, count)

        if count > settings.RATE_LIMIT_REQUESTS:
            retry_after = max(
                0,
                int(settings.RATE_LIMIT_WINDOW_SECONDS - (now - window_start)),
            )
            return False, retry_after

        return True, 0
