# Expert Decision Replay Platform

A centralized platform for recording, reviewing, and auditing organizational decisions — the problem statement, alternatives considered, evaluation criteria, risks, discussions, approvals, and final outcomes — so organizations can preserve institutional knowledge and avoid repeating past mistakes.

Built for enterprises, consulting firms, engineering organizations, healthcare institutions, government departments, universities, and research organizations that need structured decision documentation, multi-level approval workflows, discussion threads, version history, audit logs, and decision analytics.

This repository currently implements **Milestone 1**: project scaffolding, authentication, and user/team management. See [Future Milestones](#future-milestones) for what's next.

---

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Creating the Database](#creating-the-database)
- [Environment Variables](#environment-variables)
- [Alembic Migration](#alembic-migration)
- [Running Locally](#running-locally)
- [API Documentation](#api-documentation)
- [Future Milestones](#future-milestones)

---

## Project Description

The Expert Decision Replay Platform supports:

- **Structured decision documentation** — problem statement, category, rationale, version history
- **Alternative analysis** — multiple options with pros/cons, cost estimates, feasibility scores, risk assessment
- **Discussion & collaboration** — threaded comments, meeting notes, file attachments
- **Multi-level approval workflows** — reviewer assignment, approval history, escalation
- **Audit & compliance** — immutable audit log of every significant action, soft-deletes throughout (nothing is ever physically erased from an audited entity)
- **Knowledge repository** — search, category filtering, timeline view, document archive
- **Reporting & analytics** — decision, approval, team, and audit reports with PDF/Excel export

The system is built as a layered architecture — **Router → Service → Repository → Model** — so HTTP concerns, business rules, and persistence stay independently testable and replaceable as later milestones add Decision Management, Approval Workflows, and Reporting on top of this foundation.

---

## Tech Stack

**Backend**
- Python 3.11+
- FastAPI (async)
- Uvicorn (ASGI server)

**Database**
- PostgreSQL
- SQLAlchemy 2.0 (async, `asyncpg` driver)
- Alembic (migrations)

**Auth & Security**
- JWT (`python-jose`)
- OAuth2 Password Flow
- Passlib + bcrypt (password hashing)

**Validation**
- Pydantic v2 (`pydantic-settings` for config)

**DevOps**
- Docker / Docker Compose
- GitHub Actions
- Postman

---

## Folder Structure
expert-decision-replay-platform/
│
├── alembic/
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
├── alembic.ini
│
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app entrypoint
│   │
│   ├── core/                        # Cross-cutting concerns
│   │   ├── __init__.py
│   │   ├── config.py                # Settings (Pydantic BaseSettings)
│   │   ├── security.py              # Password hashing, JWT encode/decode
│   │   ├── logging_config.py        # Structured logging setup
│   │   ├── exceptions.py            # Custom exception classes
│   │   └── constants.py             # Enums, role names, status codes
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py                  # Declarative Base import aggregator
│   │   ├── session.py                # Engine + SessionLocal + get_db dependency
│   │   └── init_db.py                # Seed data (roles, default admin)
│   │
│   ├── models/                      # SQLAlchemy ORM models (one file per domain entity)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── role.py
│   │   ├── team.py
│   │   └── audit_log.py             # Generic audit trail model (used from M1 onward)
│   │
│   ├── schemas/                     # Pydantic v2 request/response models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── auth.py
│   │   ├── team.py
│   │   └── token.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                  # Shared FastAPI dependencies (get_current_user, RBAC guards)
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py            # Aggregates all v1 routers
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── auth.py          # /auth/login, /auth/refresh, /auth/logout
│   │           ├── users.py         # /users CRUD, /users/me
│   │           ├── teams.py         # /teams CRUD
│   │           └── health.py        # /health, /version
│   │
│   ├── services/                    # Business logic layer (framework-agnostic)
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   └── team_service.py
│   │
│   ├── repositories/                # Data access layer (query encapsulation)
│   │   ├── __init__.py
│   │   ├── base_repository.py       # Generic CRUD repository
│   │   ├── user_repository.py
│   │   └── team_repository.py
│   │
│   └── utils/
│       ├── __init__.py
│       ├── pagination.py
│       └── validators.py
│
├── tests/
│   ├── conftest.py                  # Test DB, fixtures, TestClient
│   ├── unit/
│   │   ├── test_auth_service.py
│   │   └── test_user_service.py
│   └── integration/
│       ├── test_auth_api.py
│       └── test_users_api.py
│
├── scripts/
│   ├── create_superuser.py
│   └── wait_for_db.py
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── requirements.txt / pyproject.toml
└── README.md

---

## Installation

**Prerequisites:** Python 3.11+, PostgreSQL 14+, `pip`, `git`.

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/expert-decision-replay-platform.git
cd expert-decision-replay-platform

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt
```

`requirements.txt` should include at minimum:
fastapi
uvicorn[standard]
sqlalchemy[asyncio]>=2.0
asyncpg
alembic
psycopg2-binary
pydantic
pydantic-settings
python-jose[cryptography]
passlib[bcrypt]
python-multipart

---

## Creating the Database

Alembic manages tables and schema — it does **not** create the database itself. Create it once per environment before migrating:

```bash
# Using createdb
createdb edrp_db

# — or, via psql —
psql -U postgres -c "CREATE DATABASE edrp_db;"
```

---

## Environment Variables

Create a `.env` file at the repo root (see `.env.example` for the full template — never commit the real `.env`):

| Variable | Description | Example |
|---|---|---|
| `ENVIRONMENT` | `development` \| `staging` \| `production` \| `test` | `development` |
| `DEBUG` | Enables verbose logging / SQL echo | `true` |
| `DATABASE_URL` | Async Postgres connection string | `postgresql+asyncpg://edrp_user:edrp_password@localhost:5432/edrp_db` |
| `DB_POOL_SIZE` | SQLAlchemy connection pool size | `10` |
| `DB_MAX_OVERFLOW` | Max overflow connections beyond pool size | `20` |
| `SECRET_KEY` | JWT signing key — **must** be ≥32 characters, unique per environment | `openssl rand -hex 32` output |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `7` |
| `BACKEND_CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000,https://app.example.com` |

`SECRET_KEY` has no safe default in production — `config.py` fails startup validation if it's under 32 characters, and there is no fallback for a missing value once `ENVIRONMENT=production`.

---

## Alembic Migration

Run from the repo root, with `DATABASE_URL` exported (or present in `.env`):

```bash
# Apply all migrations up to the latest — creates every table, enum
# type, index, and constraint in Postgres.
alembic upgrade head

# Confirm the current revision and inspect the resulting tables.
alembic current
psql "$DATABASE_URL" -c "\dt"

# Roll back one revision (sanity-check downgrade() is reversible).
alembic downgrade -1
alembic upgrade head
```

To generate a **new** migration after changing a model:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

The first migration (`2026_07_09_1200_create_initial_schema.py`) is hand-written rather than autogenerated, because `teams.manager_id` and `users.team_id` form a mutual foreign-key dependency that autogenerate can't resolve in one pass — it creates `teams` without its FK, creates `users`, then adds the `teams → users` FK back in afterward.

---

## Running Locally

```bash
# From the repo root, with the venv activated and .env configured:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`, prefixed with `/api/v1` for every versioned route (e.g. `http://localhost:8000/api/v1/auth/login`).

**Seed the fixed roles before registering a user** — `POST /auth/register` assigns the `employee` role, which must already exist:

```bash
python -m app.db.init_db
```

**Docker Compose** (app + Postgres):

```bash
docker-compose up --build
```

---

## API Documentation

Interactive, auto-generated docs are available once the app is running:

- **Swagger UI:** `http://localhost:8000/api/v1/docs`
- **ReDoc:** `http://localhost:8000/api/v1/redoc`
- **OpenAPI schema (JSON):** `http://localhost:8000/api/v1/openapi.json`

Swagger's "Authorize" button works directly against `POST /api/v1/auth/login` (OAuth2 password flow — `username` is the account's email).

### Milestone 1 Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/health` | Liveness/readiness probe | None |
| GET | `/api/v1/version` | Build/version metadata | None |
| POST | `/api/v1/auth/register` | Self-register (assigned `employee` role) | None |
| POST | `/api/v1/auth/login` | OAuth2 password login → access + refresh token | None |
| POST | `/api/v1/auth/refresh` | Exchange refresh token for a new access token (rotates) | Refresh token |
| POST | `/api/v1/auth/logout` | Revoke a refresh token | Refresh token |
| GET | `/api/v1/users/me` | Current authenticated user's profile | Bearer token |
| PATCH | `/api/v1/users/me` | Update own profile | Bearer token |
| POST | `/api/v1/users/me/password` | Change own password | Bearer token |
| GET | `/api/v1/users/` | List users (paginated) | Manager / Administrator |
| POST | `/api/v1/users/` | Create user | Administrator |
| GET | `/api/v1/users/{user_id}` | Get a specific user | Self, Manager, or Administrator |
| PATCH | `/api/v1/users/{user_id}` | Update a user | Administrator |
| DELETE | `/api/v1/users/{user_id}` | Deactivate (soft-delete) a user | Administrator |
| PATCH | `/api/v1/users/{user_id}/role` | Assign a role | Administrator |
| GET | `/api/v1/teams/` | List teams (paginated) | Bearer token |
| POST | `/api/v1/teams/` | Create a team | Manager / Administrator |
| GET | `/api/v1/teams/{team_id}` | Get a team, with roster | Bearer token |
| PATCH | `/api/v1/teams/{team_id}` | Update a team | Manager / Administrator |
| DELETE | `/api/v1/teams/{team_id}` | Deactivate (soft-delete) a team | Administrator |
| POST | `/api/v1/teams/{team_id}/members` | Add a member | Manager / Administrator |
| DELETE | `/api/v1/teams/{team_id}/members/{user_id}` | Remove a member | Manager / Administrator |

All error responses share one JSON shape: `{"error": "<error_code>", "detail": "..."}`.

---

## Future Milestones

**Milestone 2 (Week 3–4) — Decision Management & Collaboration**
- Decision CRUD, categories, version history
- Alternative analysis (pros/cons, cost comparison, feasibility, risk)
- Discussion module — comments, threaded replies, meeting notes
- File uploads/attachments

**Milestone 3 (Week 5–6) — Workflow & Insight**
- Multi-level approval workflows, reviewer assignment, escalation
- Notifications
- Audit logging surfaced through the API
- Reports & dashboards (Employee / Manager / Admin views)

**Milestone 4 (Week 7–8) — Production Readiness**
- Full test suite (unit + integration)
- Docker deployment hardening
- Complete documentation
- Final presentation and handoff

---

*This README reflects the Milestone 1 state of the project — authentication, user management, and team management. It will be updated as each subsequent milestone lands.*