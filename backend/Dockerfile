# ─────────────────────────────────────────────────────────────────
# Stage 1 – Build: install all Python deps into a venv
# ─────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Build-time system deps (gcc for bcrypt C ext, libpq-dev for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create an isolated virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# ─────────────────────────────────────────────────────────────────
# Stage 2 – Runtime: lean image with only the venv + app source
# ─────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

# Runtime libpq (psycopg2 needs libpq at runtime) + curl (healthcheck) + pg_isready (entrypoint)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy the pre-built venv from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Activate the venv for all subsequent commands
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH="/app" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy application source (respects .dockerignore)
COPY . .

# Create uploads directory and set up non-root user in one layer
RUN addgroup --system appgroup \
 && adduser --system --ingroup appgroup --no-create-home appuser \
 && mkdir -p /app/uploads \
 && chown -R appuser:appgroup /app \
 && chmod +x /app/entrypoint.sh

USER appuser

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
