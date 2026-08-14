# middleware/rate_limit.py
"""
middleware/rate_limit.py

Simple fixed-window API rate limiter, keyed by client IP.

In-memory counters — adequate for a single-process deployment/demo.
A multi-worker or multi-instance deployment would need a shared store
(e.g. Redis) instead, since each process would otherwise track its
own independent counters.
"""

from __future__ import annotations

import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):

    def __init__(self, app) -> None:
        super().__init__(app)
        # client_key -> (window_start_monotonic, request_count)
        self._windows: dict[str, tuple[float, int]] = defaultdict(lambda: (0.0, 0))

    async def dispatch(self, request: Request, call_next):

        client_key = request.client.host if request.client else "unknown"

        now = time.monotonic()
        window_start, count = self._windows[client_key]

        if now - window_start >= settings.RATE_LIMIT_WINDOW_SECONDS:
            window_start, count = now, 0

        count += 1
        self._windows[client_key] = (window_start, count)

        if count > settings.RATE_LIMIT_REQUESTS:
            retry_after = max(
                0,
                int(settings.RATE_LIMIT_WINDOW_SECONDS - (now - window_start)),
            )
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limited",
                    "detail": "Too many requests. Please slow down and try again shortly.",
                },
                headers={"Retry-After": str(retry_after)},
            )

        return await call_next(request)
