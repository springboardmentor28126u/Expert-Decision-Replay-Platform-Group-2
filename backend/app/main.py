"""FastAPI application entry point.

Expert Decision Replay Platform — Backend API
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.middleware.error_handler import error_handler_middleware
from app.middleware.logging import logging_middleware
from app.middleware.audit_middleware import audit_middleware
from app.routers import auth, users, decisions, alternatives, discussions, files, audit

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle events."""
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    # Create uploads directory
    import os
    os.makedirs(settings.upload_dir, exist_ok=True)
    yield
    logger.info("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Platform for recording and replaying organizational decisions",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.middleware("http")(logging_middleware)
app.middleware("http")(error_handler_middleware)
app.middleware("http")(audit_middleware)

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(decisions.router)
app.include_router(alternatives.router)
app.include_router(discussions.router)
app.include_router(files.router)
app.include_router(audit.router)


@app.get("/", tags=["Health"])
def root():
    """Health check endpoint."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    """API health check."""
    from app.database import engine
    try:
        with engine.connect() as conn:
            conn.execute(
                __import__("sqlalchemy").text("SELECT 1")
            )
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}
