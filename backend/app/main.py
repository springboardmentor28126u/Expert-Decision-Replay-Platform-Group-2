"""
Expert Decision Replay Platform - Main Application

FastAPI application factory and configuration.
"""

import logging
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.limiter import limiter
from app.api.v1.router import api_router
from app.middleware.request_logging import RequestLoggingMiddleware, SecurityHeadersMiddleware

logger = logging.getLogger("expert_decision")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup & shutdown logic."""
    # --- Startup ---
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)

    # Create tables if they don't exist (dev convenience; Alembic handles prod)
    # Only run in DEBUG mode - production should use Alembic migrations
    if settings.DEBUG:
        from app.database.base import Base
        from app.database.session import engine
        import app.models  # noqa: F401 — ensure all models are imported
        Base.metadata.create_all(bind=engine)
        logger.info("DEBUG mode: Tables created via create_all()")
    else:
        logger.info("Production mode: Using Alembic for database migrations")

    # Seed predefined roles + default admin
    from app.database.seed import run_seed
    try:
        run_seed()
    except Exception as e:
        logger.warning("Seed failed (non-fatal): %s", e)

    yield  # Application runs here

    # --- Shutdown ---
    logger.info("Shutting down %s", settings.APP_NAME)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Enterprise platform where organizations record, review, approve, and analyze important decisions.",
        openapi_url="/api/v1/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # Global exception handler — ensures CORS headers are always present,
    # even when an unhandled error returns a 500.
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        # Let FastAPI's built-in handler deal with HTTPExceptions.
        # This preserves the correct status code (403, 404, etc.) and
        # ensures CORSMiddleware can add headers to the response.
        if isinstance(exc, HTTPException):
            raise exc
        logger.error(
            "Unhandled exception on %s %s: %s\n%s",
            request.method,
            request.url.path,
            exc,
            traceback.format_exc(),
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    # Custom Middlewares — added first so they run INSIDE the CORS wrapper.
    # In Starlette, each add_middleware() wraps the previous one, so the
    # LAST added middleware is the OUTERMOST.  CORSMiddleware must be last
    # so it can inject headers on every response, including error responses.
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    # Setup CORS — added LAST so it is the outermost middleware and
    # always adds Access-Control-Allow-* headers to every response.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Company-ID"],
    )

    # Setup Rate Limiting
    async def _custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded"}
        )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _custom_rate_limit_exceeded_handler)

    # Include API Routers
    app.include_router(api_router, prefix="/api/v1")

    @app.get("/health", tags=["Health"])
    def health_check():
        """Basic health check endpoint."""
        return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}

    return app


app = create_app()
