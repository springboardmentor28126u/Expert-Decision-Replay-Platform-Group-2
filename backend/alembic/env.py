"""
alembic/env.py – Alembic environment configuration for EDRP.

Reads DATABASE_URL from the environment (set by docker-compose or .env).
Imports all models via app.database.base.Base so autogenerate detects them.
"""
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Alembic Config object
config = context.config

# Logging setup
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ── Pull in every model so autogenerate can diff them ─────────────────────────
# Order matters: import Base first, then all model modules.
from app.database.base import Base  # noqa: E402
from app import models              # noqa: E402, F401  – registers all ORM models

target_metadata = Base.metadata

# ── Database URL from environment (never hardcoded) ────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "Ensure your .env file is loaded or the variable is exported."
    )

# Alembic uses synchronous SQLAlchemy, so strip async driver prefix if present
DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
config.set_main_option("sqlalchemy.url", DATABASE_URL)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (generate SQL without a live connection)."""
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (against a live database connection)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
