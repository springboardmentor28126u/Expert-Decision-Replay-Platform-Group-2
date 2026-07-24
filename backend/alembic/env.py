"""
alembic/env.py

Async-aware Alembic environment. Standard Alembic scaffolding assumes a
sync engine; this project's engine (database.py) is asyncpg-based, so
migrations run through AsyncEngine.run_sync(), which executes the
actual (synchronous) migration logic inside an async connection.

sys.path is extended to include app/ because everything in app/ uses
flat imports (from config import settings, from database import Base) —
matching main.py's own import style rather than introducing a second,
inconsistent app.config / app.database convention just for Alembic.
"""
import asyncio
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

# --- Make app/ importable exactly like the running application does ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.join(BASE_DIR, "app")
sys.path.insert(0, APP_DIR)

from app.config import settings  # noqa: E402
from app.database import Base  # noqa: E402
import app.models  # noqa: E402,F401  — populates Base.metadata with every model

# Alembic Config object, provides access to values in alembic.ini
config = context.config

# Inject the real DB URL from Settings instead of alembic.ini, so there
# is exactly one source of truth for DATABASE_URL (see architecture
# doc, section 6 — "never re-read os.environ scattered across files").
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Autogenerate support: Alembic diffs against this metadata.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Offline mode: emits SQL to stdout without a live DB connection
    (`alembic upgrade head --sql`). Useful for generating a script a
    DBA reviews/applies manually in a locked-down production environment.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable: AsyncEngine = create_async_engine(
        settings.DATABASE_URL,
        poolclass=pool.NullPool,  # migrations are one-shot; no pooling needed
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
