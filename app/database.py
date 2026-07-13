"""
Database engine and session management.

Async end-to-end (asyncpg driver + SQLAlchemy AsyncSession) since this
platform expects concurrent multi-role traffic (employees, reviewers,
managers, and administrators hitting approval/notification endpoints
simultaneously) — blocking sync sessions would serialize DB-bound work
per worker.
"""

import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = logging.getLogger("edrp.database")


class Base(DeclarativeBase):
    """
    Root declarative base for every ORM model.

    Lives here (rather than in models/) so `database.py` has zero
    dependency on `models/`, while `models/` depends on `database.py` —
    a one-directional import graph avoids circular imports between the
    engine setup and the model definitions.
    """
    pass


# `pool_pre_ping` guards against stale connections after DB restarts or
# idle timeouts — cheap insurance against "server closed the connection
# unexpectedly" errors under low-traffic periods.
# `pool_size`/`max_overflow` are conservative production defaults; tune
# per actual concurrent-connection needs once load-tested.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    future=True,
)

# `expire_on_commit=False` is essential in async FastAPI apps: without
# it, accessing an attribute on a committed object after the session
# closes triggers an implicit (sync, blocking) refresh query that fails
# under asyncio. Pydantic response serialization happens after the
# request's DB work is logically done, so objects must stay usable.
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding a request-scoped AsyncSession.

    One session per request, always closed afterward regardless of
    outcome. Deliberately does NOT commit here — commits are the
    responsibility of the service layer (a route calling three service
    methods that each commit independently would leave the DB in a
    half-applied state on a mid-request failure). This dependency only
    guarantees cleanup, not transaction boundaries.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
