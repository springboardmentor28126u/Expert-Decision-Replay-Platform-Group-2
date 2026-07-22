# Troubleshooting & Recovery Guide

This guide covers typical errors, resolution steps, and fallback mechanisms for the **Expert Decision Replay Platform**.

---

## 🔌 1. Connection Errors (502 Bad Gateway / Network Failures)

### Symptoms:
*   Flask frontend displays: `"Connection to authentication service failed: [Errno 111] Connection refused"`.
*   FastAPI Swagger UI fails to fetch metadata schema.

### Solutions:
1.  **Container startup order**: The backend container must wait for the database (`db`) and Redis (`redis`) to report healthy statuses. Verify that their healthcheck scripts execute correctly:
    ```bash
    docker compose ps
    ```
2.  **Host IP conflicts**: If running locally outside Docker, ensure `localhost:8000` is active and not bound by other development tasks.
3.  **Port Mapping Mismatch**: Double check that `.env` parameters align with container ports mapping (e.g. `BACKEND_API_URL` should equal `http://backend:8000` inside containers and `http://localhost:8000` when running test clients).

---

## 🗄️ 2. Database & Schema Errors

### Symptom:
*   FastAPI backend logs error: `"relation 'audit_logs' does not exist"`.
*   Alembic reports `"Target database is not up to date."`.

### Solutions:
1.  **Run migrations head**: Apply schema upgrades inside the backend container:
    ```bash
    docker compose exec backend alembic upgrade head
    ```
2.  **Clear local cache database**: If testing locally on SQLite and database locks arise, remove the SQLite cache files safely:
    ```bash
    rm expert_decision_replay.db
    ```
    FastAPI will automatically recreate and seed the fallback database upon startup.

---

## 🔑 3. Authentication & JWT Validation Issues

### Symptom:
*   User logs in but is immediately redirected back to `/login` with `"Could not validate credentials"` error.
*   Token validation throws `Signature has expired` errors.

### Solutions:
1.  **Secret Key Mismatch**: Ensure the backend container's `SECRET_KEY` env variable is identical to the one in use during token encryption.
2.  **Expiry Settings**: Verify `ACCESS_TOKEN_EXPIRE_MINUTES` is set to a reasonable duration (default 120 minutes) to avoid token timeout errors.
3.  **Clock Drift**: Sync the container system clock to avoid datetime offset conflicts.
