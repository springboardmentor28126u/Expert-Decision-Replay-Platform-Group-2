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


class SecurityHeadersMiddleware:
    """ASGI middleware that adds security headers to all responses."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = message.get("headers", [])
                # Add security headers
                security_headers = [
                    (b"x-content-type-options", b"nosniff"),
                    (b"x-frame-options", b"DENY"),
                    (b"x-xss-protection", b"1; mode=block"),
                    (b"referrer-policy", b"strict-origin-when-cross-origin"),
                    (b"permissions-policy", b"camera=(), microphone=(), geolocation=()"),
                ]
                # Only add HSTS in production (not localhost)
                import os
                if not os.environ.get("DEBUG", "").lower() == "true":
                    security_headers.append(
                        (b"strict-transport-security", b"max-age=31536000; includeSubDomains")
                    )
                headers.extend(security_headers)
                message["headers"] = headers
            await send(message)

        return await self.app(scope, receive, send_wrapper)
