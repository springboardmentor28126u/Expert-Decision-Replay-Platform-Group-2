#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
python wait_for_db.py

echo "Running Alembic migrations..."
# This repo's migration graph has two independent roots: `fresh_local`
# (builds the full schema from an empty DB — what a fresh container's
# Postgres actually is) and `shared_legacy` (reconciles the pre-existing
# shared Neon DB's legacy tables; its own baseline is a deliberate no-op
# and cannot bootstrap an empty database). The bare `head` keyword is
# ambiguous between them, so Docker always targets `fresh_local`
# explicitly — see alembic/versions/83f9966ec583_create_initial_schema.py.
alembic upgrade fresh_local@head

echo "Seeding default roles (idempotent)..."
python -m app.db.init_db

echo "Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
