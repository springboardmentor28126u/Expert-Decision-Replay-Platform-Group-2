"""
Expert Decision Replay Platform - Request Logging Middleware

Pure ASGI middleware — does NOT extend BaseHTTPMiddleware, which is known
to interfere with CORSMiddleware by intercepting exception responses
before outer middleware can add headers.
"""

import time
from app.core.logging import logger


class RequestLoggingMiddleware:
    """Lightweight ASGI middleware that logs request method, path, and duration."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        start_time = time.time()
        method = scope.get("method", "")
        path = scope.get("path", "")
        client = scope.get("client")
        client_ip = client[0] if client else "unknown"

        logger.info("Request: %s %s from %s", method, path, client_ip)

        async def send_wrapper(message):
            await send(message)

        await self.app(scope, receive, send_wrapper)

        process_time = (time.time() - start_time) * 1000
        logger.info(
            "Response: %s %s completed in %.2fms",
            method, path, process_time,
        )
