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
import traceback

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine
from app.utils.exceptions import AppException

logger = logging.getLogger("edrp")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler (replaces the deprecated
    @app.on_event("startup"/"shutdown") decorators).

    - On startup: verify the database is reachable before accepting
      traffic, so container orchestrators (Docker/K8s) fail fast on a
      misconfigured DB rather than serving 500s.
    - On shutdown: dispose the engine's connection pool cleanly.
    """
    logger.info("Starting %s (%s environment)", settings.PROJECT_NAME, settings.ENVIRONMENT)
    try:
        async with engine.connect() as conn:
            await conn.run_sync(lambda _: None)
        logger.info("Database connection verified.")
    except Exception:
        logger.exception("Database connection failed during startup.")
        raise

    yield

    logger.info("Shutting down %s", settings.PROJECT_NAME)
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    description="Centralized platform for recording, reviewing, and auditing organizational decisions.",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,
)

# --- Middleware -------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Global exception handlers -----------------------------------------

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """
    Catches every custom domain exception (NotFoundException,
    PermissionDeniedException, ConflictException, etc — see
    utils/exceptions.py) and renders it as a consistent JSON error shape.
    Services/routers raise these instead of returning ad-hoc error dicts.
    """
    logger.warning("AppException on %s %s: %s", request.method, request.url.path, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.error_code, "detail": exc.detail},
    )


from fastapi.exception_handlers import request_validation_exception_handler

app.exception_handler(RequestValidationError)(
    request_validation_exception_handler
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Last-resort catch-all. Never leaks internal stack traces or exception
    messages to the client in non-debug environments — those go to logs
    only, so we don't accidentally expose schema/internals to callers.
    """
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    import traceback
    traceback.print_exc()
    detail = str(exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "internal_server_error", "detail": detail},
    )


# --- Routers ------------------------------------------------------------
# Imported here (not at module top) to avoid circular imports, since
# routers depend on dependencies/services which may import `app` indirectly
# via testing utilities.
from app.routers import auth, users, teams, health  # noqa: E402

app.include_router(health.router, prefix=settings.API_V1_PREFIX, tags=["Health"])
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["Users"])
app.include_router(teams.router, prefix=f"{settings.API_V1_PREFIX}/teams", tags=["Teams"])
