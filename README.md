# Expert Decision Replay Platform (EDRP) — Milestone 3

> **Group 5** | A centralized platform for documenting, managing, replaying, and reviewing strategic organizational decisions.

## Milestone 3 Executive Summary

Milestone 3 completes the core enterprise requirements of the **Expert Decision Replay Platform (EDRP)**, delivering:

1. **Append-Only Structured Audit Logging** with field-level before/after diff tracking and database-level immutability triggers.
2. **Configurable Multi-Tier Approval Chains** supporting dynamic routing, sequential reviewer evaluations, and SLA notifications.
3. **Interactive Decision Replay & Versioning Engine** providing point-in-time snapshotting and visual historical playback.
4. **Reviewer Workspace & Role-Tailored Dashboards** for Administrators, Managers, Reviewers, and Employees.
5. **Security Hardening & Access Control** with PostgreSQL Row-Level Security (RLS), least-privilege database roles, 6-digit SMTP OTP onboarding, and 72-hour persistent sessions.
6. **Enterprise Settings & Support Ticketing System** for platform configuration, SMTP controls, and user issue resolution.
7. **Fully Containerized Local Deployment** via Docker Compose — Postgres, Redis, FastAPI backend, Celery worker/beat, and Flask frontend all orchestrated with a single command.

---

## Key Modules Implemented in Milestone 3

### 1. Structured & Append-Only Audit Logging System
An enterprise-grade audit trail designed for regulatory compliance (SOC 2, ISO 27001) that tracks every state change across the platform:
- **Structured Log Model (`AuditLog`)**: Captures actor ID, action type, entity type, entity ID, JSON diffs, client IP address, User-Agent, and timestamps.
- **Field-Level Diff Engine (`diff.py`)**: Computes granular per-field differences between previous and updated states (`before`/`after`).
- **Database Immutability Triggers**: PostgreSQL triggers block any `UPDATE` or `DELETE` operations on the `audit_logs` table to guarantee an append-only, tamper-proof record.
- **Decision Audit Trail Timeline API**: Aggregates decision versions, reviewer assessments, comments, uploads, and audit records into a single unified timeline.
- **Live Polling Audit Viewer**: Real-time 5-second polling interface with multi-criteria filtering (Entity, Actor, Action, Date Range) and one-click CSV export.

### 2. Configurable Multi-Tier Approval Chains
A dynamic workflow engine for routing and approving strategic decisions:
- **Dynamic Approval Chain Configs**: Admin-configurable multi-step approval workflows based on decision category and budget threshold rules.
- **Reviewer Evaluation States**:
  - **Approve**: Advances decision to next approval stage or finalizes to `Approved`.
  - **Reject**: Terminated with mandatory justification comment; alerts creator.
  - **Request Revision**: Reverts decision status to `Draft`; creator updates and resubmits, creating version `v2`.
- **Reviewer Assignment & Notifications**: Reviewers assigned directly via UI; automated alerts dispatched via in-app notifications and background SMTP emails.

### 3. Interactive Decision Replay & Versioning Engine
Preserves the complete evolution of organizational decisions:
- **Automated Version Snapshots**: Stores complete JSON state snapshots whenever a decision is submitted, reviewed, or modified.
- **Visual Replay Viewer**: Step-by-step playback interface allowing stakeholders to inspect who contributed, what alternatives were evaluated, what meeting notes were captured, and why final consensus was reached.

### 4. Reviewer Workspace & Role-Tailored Dashboards
Specialized interfaces for all 4 user roles:
- **Reviewer Dashboard**: Pending review queue, side-by-side alternative comparison, and fast-action approval/rejection modal.
- **Admin Dashboard**: Org-wide decision analytics, pending user approval queue, user directory, system settings, and global audit log.
- **Manager Dashboard**: Team decisions, financial impact totals, member activity overview, and escalation handling.
- **Employee Dashboard**: Personal decision tracker, draft resume panel, assigned reviews, and notification feed.

### 5. Enterprise Security & Hardened Onboarding
- **Multi-Step OTP Registration**: Cryptographic 6-digit OTP dispatched via SMTP email before password setup.
- **Auto-Generated Role-Prefixed IDs**: Automatic identifier assignment (`AD-xxx`, `MN-xxx`, `RW-xxx`, `EMP-xxx`).
- **Admin Verification Queue**: Newly registered accounts remain in `Pending Approval` until verified by an Administrator.
- **Row-Level Security (RLS)**: PostgreSQL RLS policies restrict audit log access to authorized roles.
- **Least-Privilege Database Role**: Application connections utilize `edrp_app` restricted to `SELECT` and `INSERT` on audit tables.
- **Persistent Sessions**: 72-hour persistent login with JWT tokens and Flask session security.
- **Telemetry Capture**: Client IP addresses and browser User-Agent strings stored in every audit log entry.

### 6. Enterprise Collaboration, Settings & Support Ticketing
- **Discussion Threads & Comments**: Threaded commenting and collaboration tied directly to decisions.
- **Meeting Notes**: Capture offline meeting minutes, attendee lists, and trade-off summaries.
- **System Settings Console**: Administrative control over SMTP credentials, maintenance mode, and session policies.
- **Support Ticketing System**: In-app support request submission with real-time status tracking (Open, In Progress, Resolved).

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3 (Glassmorphism), JavaScript ES6+ | UI with Lucide icons, Fetch API, async/await |
| **Frontend Server** | Flask 3.1 | Jinja2 templating, session management, reverse proxy |
| **Backend** | FastAPI, Python 3.11 | REST API, dependency injection, async support |
| **ASGI Server** | Uvicorn | Production-grade async web server |
| **Database** | PostgreSQL 15 (Alpine) | Relational data store with JSON support |
| **ORM** | SQLAlchemy | Database abstraction and model relationships |
| **Migrations** | Alembic | Version-controlled database schema changes |
| **Task Queue** | Celery (worker + beat) | Background jobs and scheduled escalation tasks |
| **Message Broker / Cache** | Redis 7 (Alpine) | Celery broker, result backend |
| **Authentication** | JWT (python-jose) | Stateless token-based authentication |
| **Password Hashing** | Passlib + Bcrypt | Secure password storage |
| **Email** | SMTP (Gmail App Password) | Background OTP and notification emails |
| **AI Assistant** | Groq API | AI-powered support/query assistance |
| **DevOps** | Docker, Docker Compose | Containerized multi-service deployment |
| **Version Control** | Git, GitHub | Source code management |

---

## Project Structure

```
expertdecision/
├── backend/                        # FastAPI application
│   ├── app/
│   │   ├── api/                    # Route handlers (20 routers)
│   │   ├── models/                 # SQLAlchemy ORM models (19 models)
│   │   ├── services/               # Business logic layer
│   │   ├── repositories/           # Data access layer
│   │   ├── schemas/                # Pydantic request/response models
│   │   ├── dependencies/           # Auth & role-requirement dependencies
│   │   ├── utils/                  # Utility functions (diff engine, etc.)
│   │   ├── database/               # DB connection & base model
│   │   └── main.py                 # FastAPI entry point
│   ├── alembic/                    # Database migrations
│   ├── entrypoint.sh               # Container startup script (migrations + server)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                       # Flask application
│   ├── app.py
│   ├── templates/                  # Jinja2 HTML templates (36 pages)
│   ├── static/                     # JS, CSS, images
│   ├── Dockerfile
│   └── requirements.txt
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
├── docs/                           # Architecture, ERD, API docs, user manual
├── .env.example                    # Template for required environment variables
├── .gitignore
├── docker-compose.yml              # Full local stack orchestration
└── README.md
```

---

## Running the Project Locally (Docker — Recommended)

This is the tested, working path for running the full stack on a fresh machine.

### Prerequisites
- **Docker Desktop** (with WSL2 backend enabled on Windows)
- **Git**

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd expertdecision
```

### 2. Create your `.env` file
```bash
copy .env.example .env      # Windows
cp .env.example .env        # macOS/Linux
```

Edit `.env` and fill in real values. At minimum, set:

```env
POSTGRES_DB=edrp
POSTGRES_USER=edrp_user
POSTGRES_PASSWORD=choose_a_password_without_special_symbols_like_@

SECRET_KEY=your_jwt_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

SMTP_EMAIL=your_email@gmail.com
SMTP_APP_PASSWORD=your_16_char_gmail_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

FLASK_SECRET_KEY=your_flask_secret_key

BACKEND_PORT=8000
FRONTEND_PORT=5000

ENVIRONMENT=production
ALLOWED_ORIGINS=http://localhost:5000,http://localhost:8000

GROQ_API_KEY=your_groq_api_key   # optional, powers AI support assistant
```

> ⚠️ **Avoid `@` or other URL-reserved characters in `POSTGRES_PASSWORD`.** Docker Compose builds the database connection string by concatenating `POSTGRES_USER:POSTGRES_PASSWORD@postgres`, so a password containing `@` breaks the connection string parsing.

### 3. Build and start all services
```bash
docker compose up --build
```

This starts six containers: `postgres`, `redis`, `backend`, `celery_worker`, `celery_beat`, `frontend`. First build takes a few minutes; subsequent runs are much faster.

### 4. Seed initial reference data (first run only)

On a completely fresh database, the `roles` and `teams` tables may be created but left empty (a known race condition when multiple backend workers start simultaneously). If registration fails with a foreign key error, seed them manually:

```bash
docker compose exec postgres psql -U edrp_user -d edrp
```

```sql
INSERT INTO roles (id, role_name, description) VALUES
(1, 'Admin', 'System Administrator'),
(2, 'Manager', 'Department Manager'),
(3, 'Employee', 'Employee'),
(4, 'Approver', 'Decision Approver')
ON CONFLICT (id) DO NOTHING;

INSERT INTO teams (id, team_name) VALUES (1, 'General')
ON CONFLICT (id) DO NOTHING;

SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
SELECT setval('teams_id_seq', (SELECT MAX(id) FROM teams));
\q
```

### 5. Access the application

| Service | URL |
|---------|-----|
| Frontend (Flask) | http://localhost:5000 |
| Backend API (FastAPI) | http://localhost:8000 |
| API Documentation (Swagger) | http://localhost:8000/docs |

### 6. Approve your first user

New registrations start in `Pending Approval` status and cannot log in until approved. For local testing, activate a user directly:

```bash
docker compose exec postgres psql -U edrp_user -d edrp
```
```sql
UPDATE users SET approved = TRUE, status = 'Active' WHERE employee_id = 'YOUR_EMPLOYEE_ID';
\q
```

### Everyday usage (after first-time setup)

```bash
docker compose up -d      # start in background
docker compose down       # stop (keeps data)
docker compose down -v    # stop and wipe all data (fresh reset)
docker compose logs -f backend   # tail backend logs
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `exec /app/entrypoint.sh: no such file or directory` | Windows converted the script's line endings to CRLF during clone/checkout | Open `backend/entrypoint.sh` in VS Code → click `CRLF` in bottom-right → switch to `LF` → save → rebuild |
| `Database is uninitialized and superuser password is not specified` | `.env` missing or `POSTGRES_PASSWORD` empty | Confirm `.env` exists at project root (not `.env.txt`) and contains a non-empty `POSTGRES_PASSWORD` |
| `connection to server on socket ... failed: Connection refused` | `POSTGRES_PASSWORD` contains `@` or another URL-reserved character, breaking the generated connection string | Use a password with only letters/numbers |
| `insert or update ... violates foreign key constraint "users_role_id_fkey"` | `roles` table exists but is empty | Run the seed SQL in step 4 above |
| `celery_beat` stuck in `PermissionError: /celery-beat/celerybeat.pid` loop | Stale/corrupted named volume from an earlier failed run | `docker compose down -v && docker compose up --build` for a clean volume |
| Docker Desktop: "Virtualization support not detected" | Virtualization disabled in BIOS, or WSL2/Virtual Machine Platform not enabled in Windows | Enable virtualization in BIOS; enable **Windows Subsystem for Linux** and **Virtual Machine Platform** in "Turn Windows features on or off"; run `wsl --update` |

---

## API Endpoints

| Prefix | Module | Description |
|--------|--------|-------------|
| `/users` | `user_api` | User CRUD, registration, admin approval |
| `/roles` | `role_api` | Role management and assignment |
| `/teams` | `team_api` | Team creation and management |
| `/decisions` | `decision_api` | Decision lifecycle operations |
| `/alternatives` | `alternative_api` | Alternative evaluation CRUD |
| `/reviews` | `review_api` | Reviewer assignments and assessments |
| `/replays` | `replay_api` | Decision replay engine |
| `/audit-logs` | `audit_api` | Structured audit logs + decision trail |
| `/approval-chains` | `approval_chain_api` | Configurable approval chain management |
| `/dashboard` | `dashboard_api` | Dashboard data aggregation |
| `/profile` | `profile_api` | User profile operations |
| `/notifications` | `notification_api` | In-app notification system |
| `/discussions` | `discussion_api` | Discussion threads and comments |
| `/upload` | `upload_api` | File upload handling |
| `/reports` | `report_api` | Report generation |
| `/repository` | `repository_api` | Decision repository browser |
| `/settings` | `settings_api` | System configuration |
| `/support` | `support_api` | Support ticket system |

---

## Database Schema Summary

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | User accounts with roles and teams | FK to roles, teams |
| `roles` | Role definitions (Admin, Manager, Employee, Approver) | Referenced by users |
| `teams` | Organizational teams | Referenced by users |
| `decisions` | Decision records with full metadata | FK to users (creator) |
| `decision_versions` | Version snapshots of decisions | FK to decisions, users |
| `alternatives` | Evaluated alternatives per decision | FK to decisions |
| `reviews` | Reviewer assessments of decisions | FK to decisions, users |
| `audit_logs` | Append-only structured audit trail | FK to users (actor) |
| `activity_logs` | Legacy activity event logging | FK to users |
| `approval_chain_configs` | Multi-step approval chain definitions | FK to users (creator) |
| `notifications` | In-app user notifications | FK to users |
| `discussion_threads` | Discussion topics per decision | FK to decisions, users |
| `comments` | Threaded comments | FK to threads, users |
| `meeting_notes` | Meeting notes per decision | FK to decisions, users |
| `attachments` | File uploads per decision | FK to decisions, users |
| `email_verifications` | OTP verification codes | Standalone |
| `support_tickets` | User support requests | FK to users |
| `system_settings` | Application configuration | Standalone |

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | Bcrypt via Passlib — passwords never stored in plaintext |
| **JWT Authentication** | Stateless tokens with configurable expiry (60-min default, 72-hour "Remember Me") |
| **Role-Based Access Control** | Four roles with endpoint-level permission checks |
| **Email OTP Verification** | 6-digit codes with expiration before account activation |
| **Admin Approval Workflow** | Accounts remain pending until administrator verification |
| **Append-Only Audit Logs** | PostgreSQL triggers block UPDATE/DELETE on audit_logs |
| **Row-Level Security** | PostgreSQL RLS policies restrict audit log access |
| **Least-Privilege DB Roles** | Separate `edrp_app` role with SELECT/INSERT only |
| **IP & User-Agent Tracking** | Client metadata captured in audit trail |
| **Field-Level Diff Logging** | Every change recorded with before/after values |

---

## Contributors

*Group 2 — Springboard Mentor Program*

---

## Milestone 3 Deliverables Summary

| Component | Quantity | Details |
|---|:---:|---|
| **Database Tables** | **18** | PostgreSQL 15 schema with RLS, triggers, JSONB, and foreign keys |
| **API Routers** | **20** | FastAPI endpoints on Port 8000 with OpenAPI / Swagger documentation |
| **UI Templates** | **36** | Jinja2 templates styled with Glassmorphism dark theme |
| **Docker Services** | **6** | postgres, redis, backend, celery_worker, celery_beat, frontend |
