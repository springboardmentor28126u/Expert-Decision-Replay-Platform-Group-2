# Docker Deployment Guide

This guide details how to build and deploy the **Expert Decision Replay Platform** stack using Docker and Docker Compose.

---

## 🏗️ Deployment Architecture

The Compose file orchestration manages four isolated services in a shared network environment:

1.  **edrp_db** (`postgres:15-alpine`): PostgreSQL relational storage mapping data onto `postgres_data` volume.
2.  **edrp_redis** (`redis:7-alpine`): Redis instance mapping caching entries on `redis_data` volume.
3.  **edrp_backend** (FastAPI): Gathers models, runs REST API operations, and mounts `uploads_data` volume for attachment assets.
4.  **edrp_frontend** (Flask): Presents templates matching port maps.

---

## 🛠️ Step-by-Step Production Launch

### 1. Configure production keys
Prepare your environmental parameters `.env` in the root workspace. Change keys and parameters to match your target host details.

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/expert_decision_replay
REDIS_URL=redis://redis:6379/0
SECRET_KEY=9e7e72a84a60183b16cf29d665f80b181db5c104e142e0fa525287e07b8b209e
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
UPLOAD_DIR=/app/uploads
BACKEND_API_URL=http://backend:8000
```

### 2. Build Container Images
Execute the Docker build compiler locally:

```bash
docker compose build
```

This commands reads backend and frontend Dockerfiles to compile multi-stage images.

### 3. Spin up services stack
Start all containers in background daemon mode:

```bash
docker compose up -d
```

### 4. Upgrade Database & Migrations
To ensure the PostgreSQL instance has all the schemas properly constructed, run the Alembic database migrations inside the active backend container:

```bash
# Run migration schema upgrades to HEAD revision
docker compose exec backend alembic upgrade head
```

---

## 🩺 System Verification Checks

1.  Confirm all container statuses are **healthy/running**:
    ```bash
    docker compose ps
    ```
2.  Check startup logs for runtime exceptions:
    ```bash
    docker compose logs backend
    ```
3.  Access the endpoints:
    *   **Frontend Dashboard Portal**: [http://localhost:5001](http://localhost:5001)
    *   **Backend API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
