"""
Expert Decision Replay Platform - Database Session

Manages SQLAlchemy engine and session factory.
Provides a dependency for FastAPI route injection.
"""

import logging

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings

logger = logging.getLogger("expert_decision")


def _init_engine():
    """
    Auto-detect database: try primary (Neon) first, fall back to local PostgreSQL.
    """
    urls_to_try = [
        ("Neon (primary)", settings.DATABASE_URL),
        ("Local PostgreSQL", settings.DATABASE_URL_LOCAL),
    ]

    for label, url in urls_to_try:
        try:
            test_engine = create_engine(
                url,
                pool_size=5,
                max_overflow=10,
                pool_pre_ping=True,
                pool_recycle=300,
                echo=settings.DEBUG,
            )
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Connected to %s", label)
            return test_engine
        except Exception as e:
            logger.warning("Could not connect to %s: %s", label, e)
            continue

    raise RuntimeError(
        "Could not connect to any database. "
        "Check DATABASE_URL (Neon) and DATABASE_URL_LOCAL (local PostgreSQL) in .env"
    )


engine = _init_engine()

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a database session.

    Yields a SQLAlchemy session and ensures it is closed after use.
    Used as a FastAPI dependency injection.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
