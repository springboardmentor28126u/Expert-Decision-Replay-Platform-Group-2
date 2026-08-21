#!/bin/sh
# entrypoint.sh – Backend container startup script.
# 1. Waits for PostgreSQL to be ready (belt-and-suspenders beyond depends_on).
# 2. Runs Alembic migrations (idempotent – safe on every restart).
# 3. Exec's the CMD passed to the container (uvicorn).
set -e

# Ensure the venv and app are on PATH / PYTHONPATH
export PATH="/opt/venv/bin:$PATH"
export PYTHONPATH="/app:${PYTHONPATH:-}"

# ── Wait for PostgreSQL ────────────────────────────────────────────────────────
# Only wait if DATABASE_URL points to postgres (not sqlite / local dev)
if echo "${DATABASE_URL:-}" | grep -q "postgresql"; then
    echo "==> Waiting for PostgreSQL to be ready..."
    # Extract host and port from DATABASE_URL
    # Format: postgresql://user:pass@host:port/db
    DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
    DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
    DB_PORT=${DB_PORT:-5432}

    RETRIES=30
    until pg_isready -h "$DB_HOST" -p "$DB_PORT" -q 2>/dev/null || [ "$RETRIES" -eq 0 ]; do
        echo "   postgres not ready yet, retrying in 2s... ($RETRIES retries left)"
        RETRIES=$((RETRIES - 1))
        sleep 2
    done

    if [ "$RETRIES" -eq 0 ]; then
        echo "ERROR: PostgreSQL did not become ready in time. Aborting."
        exit 1
    fi
    echo "==> PostgreSQL is ready."
fi

# ── Run Alembic migrations ─────────────────────────────────────────────────────
echo "==> Running Alembic migrations..."
alembic upgrade head
echo "==> Migrations complete."

# ── Start the application ──────────────────────────────────────────────────────
echo "==> Starting application: $*"
exec "$@"
