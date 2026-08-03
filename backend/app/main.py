"""
Expert Decision Replay Platform — FastAPI application entrypoint.

Responsibilities of this file, and only this file:
  - Construct the FastAPI() app instance.
  - Wire up startup/shutdown lifecycle (DB connection check, etc).
  - Register global middleware (CORS).
  - Register global exception handlers.
  - Mount versioned routers.

No business logic, no DB queries, no route handlers live here — this
stays a thin composition root so it never becomes a merge-conflict
magnet as the team grows.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import settings
from app.database import engine
from app.utils.exceptions import AppException

logger = logging.getLogger("edrp")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.

    - Verify DB connectivity before serving requests.
    - Dispose SQLAlchemy engine on shutdown.
    """

    logger.info(
        "Starting %s (%s environment)",
        settings.PROJECT_NAME,
        settings.ENVIRONMENT,
    )

    try:
        async with engine.connect() as conn:
            await conn.run_sync(lambda _: None)

        logger.info("Database connection verified.")

    except Exception:
        logger.exception(
            "Database connection failed during startup."
        )
        raise

    # --- TEMPORARY DIAGNOSTIC: confirm which physical database/roles
    # table this running process is actually connected to. Remove once
    # the registration "Default role is not configured" bug is closed.
    try:
        async with engine.connect() as conn:
            identity = (
                await conn.execute(
                    text(
                        "SELECT current_database(), current_user, "
                        "inet_server_addr(), inet_server_port()"
                    )
                )
            ).one()
            logger.warning(
                "[DIAGNOSTIC] current_database=%s current_user=%s "
                "inet_server_addr=%s inet_server_port=%s",
                identity[0], identity[1], identity[2], identity[3],
            )

            role_count = (
                await conn.execute(text("SELECT COUNT(*) FROM roles"))
            ).scalar_one()
            logger.warning("[DIAGNOSTIC] roles count = %s", role_count)

            role_rows = (
                await conn.execute(text("SELECT id, name FROM roles"))
            ).all()
            logger.warning("[DIAGNOSTIC] roles rows = %s", role_rows)

    except Exception:
        logger.exception("[DIAGNOSTIC] role/database inspection query failed.")

    yield

    logger.info("Shutting down %s", settings.PROJECT_NAME)

    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    description=(
        "Centralized platform for recording, reviewing, "
        "and auditing organizational decisions."
    ),
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------
# Exception Handlers
# ---------------------------------------------------------------------


@app.exception_handler(AppException)
async def app_exception_handler(
    request: Request,
    exc: AppException,
) -> JSONResponse:

    logger.warning(
        "AppException on %s %s: %s",
        request.method,
        request.url.path,
        exc.detail,
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "detail": exc.detail,
        },
    )


app.exception_handler(RequestValidationError)(
    request_validation_exception_handler
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:

    logger.exception(
        "Unhandled exception on %s %s",
        request.method,
        request.url.path,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_server_error",
            "detail": str(exc),
        },
    )


# ---------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------

# Imported here to avoid circular imports.

from app.routers import auth
from app.routers import users
from app.routers import teams
from app.routers import health

from app.routers import decision
from app.routers import alternative
from app.routers import approval
from app.routers import attachment
from app.routers import comment
from app.routers import notification
from app.routers import audit_log
from app.routers import dashboard

# ---------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------

app.include_router(
    health.router,
    prefix=settings.API_V1_PREFIX,
    tags=["Health"],
)

# ---------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------

app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_PREFIX}/auth",
    tags=["Authentication"],
)

# ---------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------

app.include_router(
    users.router,
    prefix=f"{settings.API_V1_PREFIX}/users",
    tags=["Users"],
)

# ---------------------------------------------------------------------
# Teams
# ---------------------------------------------------------------------

app.include_router(
    teams.router,
    prefix=f"{settings.API_V1_PREFIX}/teams",
    tags=["Teams"],
)

# ---------------------------------------------------------------------
# Decisions
# ---------------------------------------------------------------------

app.include_router(
    decision.router,
    prefix=f"{settings.API_V1_PREFIX}/decisions",
    tags=["Decisions"],
)

# ---------------------------------------------------------------------
# Alternatives
# ---------------------------------------------------------------------

app.include_router(
    alternative.router,
    prefix=f"{settings.API_V1_PREFIX}/alternatives",
    tags=["Alternatives"],
)

# ---------------------------------------------------------------------
# Approvals
# ---------------------------------------------------------------------

app.include_router(
    approval.router,
    prefix=f"{settings.API_V1_PREFIX}/approvals",
    tags=["Approvals"],
)

# ---------------------------------------------------------------------
# Comments
# ---------------------------------------------------------------------

app.include_router(
    comment.router,
    prefix=f"{settings.API_V1_PREFIX}/comments",
    tags=["Comments"],
)

# ---------------------------------------------------------------------
# Attachments
# ---------------------------------------------------------------------

app.include_router(
    attachment.router,
    prefix=f"{settings.API_V1_PREFIX}/attachments",
    tags=["Attachments"],
)

# ---------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------

app.include_router(
    notification.router,
    prefix=f"{settings.API_V1_PREFIX}/notifications",
    tags=["Notifications"],
)

# ---------------------------------------------------------------------
# Audit Logs
# ---------------------------------------------------------------------

app.include_router(
    audit_log.router,
    prefix=f"{settings.API_V1_PREFIX}/audit-logs",
    tags=["Audit Logs"],
)

# ---------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------

app.include_router(
    dashboard.router,
    prefix=f"{settings.API_V1_PREFIX}/dashboard",
    tags=["Dashboard"],
)
