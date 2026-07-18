"""
Expert Decision Replay Platform - Main Application

FastAPI application factory and configuration.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.limiter import limiter
from app.api.v1.router import api_router
from app.middleware.request_logging import RequestLoggingMiddleware

logger = logging.getLogger("expert_decision")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup & shutdown logic."""
    # --- Startup ---
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)

    # Create tables if they don't exist (dev convenience; Alembic handles prod)
    from app.database.base import Base
    from app.database.session import engine
    import app.models  # noqa: F401 — ensure all models are imported
    Base.metadata.create_all(bind=engine)

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
    
    # Setup CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Custom Middlewares
    app.add_middleware(RequestLoggingMiddleware)
    
    # Setup Rate Limiting
    from fastapi.responses import JSONResponse
    
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
