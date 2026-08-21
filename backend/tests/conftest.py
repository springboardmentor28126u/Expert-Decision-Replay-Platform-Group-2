"""
Pytest configuration and fixtures for Phase 1 regression tests.
"""
import os
import pytest
from uuid import uuid4
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.database.base import Base
from app.database.session import get_db


# Use the same database URL as the application - credentials from environment
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://localhost:5432/edrp_test",
)

# For synchronous tests, we need a sync driver
SYNC_DATABASE_URL = DATABASE_URL.replace("+asyncpg", "+psycopg2")


@pytest.fixture(scope="session")
def engine():
    """Create a test database engine."""
    from app.core.config import settings
    url = settings.DATABASE_URL.replace("+asyncpg", "+psycopg2")
    engine = create_engine(url)
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(engine):
    """Create a fresh database session for each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()

    yield session

    session.close()
    transaction.rollback()
    connection.close()
