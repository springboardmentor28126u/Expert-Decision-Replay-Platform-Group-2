"""Request logging middleware."""

import logging
import time
from typing import Callable

from fastapi import Request, Response

logger = logging.getLogger("app.requests")


async def logging_middleware(request: Request, call_next: Callable) -> Response:
    """Log incoming requests and their response times."""
    start_time = time.time()

    # Log request
    logger.info(f"→ {request.method} {request.url.path}")

    response = await call_next(request)

    # Log response with timing
    duration = round((time.time() - start_time) * 1000, 2)
    logger.info(
        f"← {request.method} {request.url.path} "
        f"status={response.status_code} duration={duration}ms"
    )

    return response
