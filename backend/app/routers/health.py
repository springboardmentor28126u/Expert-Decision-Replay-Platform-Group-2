# routers/health.py
"""
routers/health.py

Liveness/readiness probe endpoints. No auth required — polled by
container orchestrators and uptime monitors.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check(db: AsyncSession = Depends(get_db)) -> dict:
    """
    Verifies the process is up AND the DB is reachable, so an
    orchestrator can tell "process alive but DB down" apart from
    "fully healthy" instead of getting a false-positive 200.
    """
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}


@router.get("/version", status_code=status.HTTP_200_OK)
async def version_info() -> dict:
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.API_VERSION,
        "environment": settings.ENVIRONMENT,
    }

