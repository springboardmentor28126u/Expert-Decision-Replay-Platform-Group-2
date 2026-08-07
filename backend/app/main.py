"""FastAPI application entry point.

Expert Decision Replay Platform — Backend API
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.database import engine, Base
from app.config import get_settings
from app.middleware.error_handler import error_handler_middleware
from app.middleware.logging import logging_middleware
from app.middleware.audit_middleware import audit_middleware
from app.routers import (
    auth,
    users,
    decisions,
    alternatives,
    discussions,
    files,
    audit,
    dashboard,
    notification,
    team as team_router,
    decision as decision_router,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    # Ensure models are registered and tables exist
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Attempt lightweight migrations & add useful indexes
    try:
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';"))
            conn.execute(text("ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';"))
            conn.execute(text("ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;"))

            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_decisions_created_by ON decisions(created_by);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, is_read);"))
    except Exception as exc:
        logger.warning(f"Database migration & indexing check skipped/failed: {exc}")

    os.makedirs(settings.upload_dir, exist_ok=True)
    yield
    logger.info("Shutting down...")


# Create FastAPI app
app = FastAPI(title=settings.app_name, version=settings.app_version, description="Platform for recording and replaying organizational decisions", lifespan=lifespan)

# Custom middleware (registered first so CORS & GZip wrap them)
app.middleware("http")(logging_middleware)
app.middleware("http")(error_handler_middleware)
app.middleware("http")(audit_middleware)

# Enable GZip Response Compression
app.add_middleware(GZipMiddleware, minimum_size=500)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(decisions.router)
app.include_router(alternatives.router)
app.include_router(discussions.router)
app.include_router(files.router)
app.include_router(audit.router)
app.include_router(dashboard.router)
app.include_router(notification.router)
app.include_router(team_router.router)
app.include_router(decision_router.router)


@app.get("/", tags=["Health"])
def root():
    return {"name": settings.app_name, "version": settings.app_version, "status": "running"}


@app.get("/api/health", tags=["Health"])
def health_check():
    try:
        with engine.connect() as conn:
            conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}

