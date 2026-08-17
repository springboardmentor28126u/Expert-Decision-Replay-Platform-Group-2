# backend/Dockerfile
#
# Matches the Python version this project is developed/tested against
# (see venv/pyvenv.cfg). psycopg2-binary and asyncpg both ship
# prebuilt wheels for this base image, so no compiler toolchain is
# needed here.
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Explicit, allow-list copies rather than `COPY . .` — this makes it
# structurally impossible to accidentally bake .env (or anything else
# not listed here) into the image, regardless of .dockerignore.
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .
COPY wait_for_db.py .
COPY entrypoint.sh .

RUN chmod +x entrypoint.sh && mkdir -p uploads

EXPOSE 8000

# Uses the app's own liveness+DB-readiness probe (routers/health.py).
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/api/v1/health', timeout=3).status == 200 else 1)"

ENTRYPOINT ["./entrypoint.sh"]
