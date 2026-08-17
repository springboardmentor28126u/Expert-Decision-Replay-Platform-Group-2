"""
wait_for_db.py

Blocks until PostgreSQL accepts connections, or exits non-zero after a
timeout. Run once at container startup, before Alembic migrations —
see entrypoint.sh. Uses asyncpg directly (already a dependency) rather
than requiring a separate postgresql-client package in the image.

Never logs the connection string (it carries credentials) — only the
exception type on each failed attempt.
"""

import asyncio
import os
import sys

import asyncpg

MAX_ATTEMPTS = 30
DELAY_SECONDS = 2


async def wait_for_db() -> None:
    database_url = os.environ["DATABASE_URL"].replace(
        "postgresql+asyncpg://", "postgresql://"
    )
    ssl_required = os.environ.get("DB_SSL_REQUIRE", "true").strip().lower() == "true"

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            conn = await asyncpg.connect(
                database_url,
                ssl="require" if ssl_required else None,
                timeout=5,
            )
            await conn.close()
            print("PostgreSQL is ready.")
            return
        except Exception as exc:
            print(
                f"PostgreSQL not ready yet (attempt {attempt}/{MAX_ATTEMPTS}): "
                f"{type(exc).__name__}"
            )
            await asyncio.sleep(DELAY_SECONDS)

    print("PostgreSQL did not become ready in time.")
    sys.exit(1)


if __name__ == "__main__":
    asyncio.run(wait_for_db())
