import sys
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

db_url = settings.DATABASE_URL
engine = None

# Resilient connection check with fallback to SQLite for local development
if db_url.startswith("postgresql"):
    try:
        # Try to connect with a short timeout to avoid hanging
        engine = create_engine(db_url, connect_args={"connect_timeout": 3})
        # Test connection actively
        with engine.connect() as conn:
            pass
        print(f"Successfully connected to PostgreSQL database: {db_url}")
    except (OperationalError, Exception) as e:
        print(f"Warning: Failed to connect to PostgreSQL database ({db_url}): {e}", file=sys.stderr)
        print("Falling back to local SQLite database 'decision_replay.db' for local development.", file=sys.stderr)
        db_url = "sqlite:///./decision_replay.db"
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    # If already using SQLite or other dialetic
    connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
    engine = create_engine(db_url, connect_args=connect_args)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for DB models
Base = declarative_base()

# Dependency to get db session in API endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
