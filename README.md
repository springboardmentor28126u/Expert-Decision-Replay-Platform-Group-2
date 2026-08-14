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

---

## Key Modules Implemented in Milestone 3

### 1. Structured & Append-Only Audit Logging System
An enterprise-grade audit trail designed for regulatory compliance (SOC 2, ISO 27001) that tracks every state change across the platform:
- **Structured Log Model (`AuditLog`)**: Captures actor ID, action type, entity type, entity ID, JSON diffs, client IP address, User-Agent, and timestamps.
- **Field-Level Diff Engine (`diff.py`)**: Computes granular per-field differences between previous and updated states (`before`/`after`).
- **Database Immutability Triggers**: PostgreSQL triggers block any `UPDATE` or `DELETE` operations on the `audit_logs` table to guarantee an append-only, tamper-proof record.
- **Decision Audit Trail Timeline API**: Aggregates decision versions, reviewer assessments, comments, uploads, and audit records into a single unified timeline.
- **Live Polling Audit Viewer**: Real-time 5-second polling interface with multi-criteria filtering (Entity, Actor, Action, Date Range) and one-click CSV export.

---

### 2. Configurable Multi-Tier Approval Chains
A dynamic workflow engine for routing and approving strategic decisions:
- **Dynamic Approval Chain Configs**: Admin-configurable multi-step approval workflows based on decision category and budget threshold rules.
- **Reviewer Evaluation States**:
  - **Approve**: Advances decision to next approval stage or finalizes to `Approved`.
  - **Reject**: Terminated with mandatory justification comment; alerts creator.
  - **Request Revision**: Reverts decision status to `Draft`; creator updates and resubmits, creating version `v2`.
- **Reviewer Assignment & Notifications**: Reviewers assigned directly via UI; automated alerts dispatched via in-app notifications and background SMTP emails.

---

### 3. Interactive Decision Replay & Versioning Engine
Preserves the complete evolution of organizational decisions:
- **Automated Version Snapshots**: Stores complete JSON state snapshots whenever a decision is submitted, reviewed, or modified.
- **Visual Replay Viewer**: Step-by-step playback interface allowing stakeholders to inspect who contributed, what alternatives were evaluated, what meeting notes were captured, and why final consensus was reached.

---

### 4. Reviewer Workspace & Role-Tailored Dashboards
Specialized interfaces for all 4 user roles:
- **Reviewer Dashboard**: Pending review queue, side-by-side alternative comparison, and fast-action approval/rejection modal.
- **Admin Dashboard**: Org-wide decision analytics, pending user approval queue, user directory, system settings, and global audit log.
- **Manager Dashboard**: Team decisions, financial impact totals, member activity overview, and escalation handling.
- **Employee Dashboard**: Personal decision tracker, draft resume panel, assigned reviews, and notification feed.

---

### 5. Enterprise Security & Hardened Onboarding
- **Multi-Step OTP Registration**: Cryptographic 6-digit OTP dispatched via SMTP email before password setup.
- **Auto-Generated Role-Prefixed IDs**: Automatic identifier assignment (`AD-xxx`, `MN-xxx`, `RW-xxx`, `EMP-xxx`).
- **Admin Verification Queue**: Newly registered accounts remain in `Pending Approval` until verified by an Administrator.
- **Row-Level Security (RLS)**: PostgreSQL RLS policies restrict audit log access to authorized roles.
- **Least-Privilege Database Role**: Application connections utilize `edrp_app` restricted to `SELECT` and `INSERT` on audit tables.
- **Persistent Sessions**: 72-hour persistent login with JWT tokens and Flask session security.
- **Telemetry Capture**: Client IP addresses and browser User-Agent strings stored in every audit log entry.

---

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
| **Backend** | FastAPI, Python 3.10+ | REST API, dependency injection, async support |
| **ASGI Server** | Uvicorn 0.49 | Production-grade async web server |
| **Database** | PostgreSQL 15 | Relational data store with JSON support |
| **ORM** | SQLAlchemy | Database abstraction and model relationships |
| **Migrations** | Alembic | Version-controlled database schema changes |
| **Authentication** | JWT (python-jose) | Stateless token-based authentication |
| **Password Hashing** | Passlib + Bcrypt | Secure password storage |
| **Email** | SMTP (threaded) | Background OTP and notification emails |
| **Session** | Flask sessions | 72-hour persistent login with "Remember Me" |
| **DevOps** | Docker, Docker Compose | Containerized deployment |
| **Version Control** | Git, GitHub | Source code management |

---

## Project Structure

```
EDRP/
├── backend/
│   ├── app/
│   │   ├── api/                    # FastAPI route handlers (20 routers)
│   │   │   ├── user_api.py         # User CRUD & management
│   │   │   ├── role_api.py         # Role management
│   │   │   ├── team_api.py         # Team management
│   │   │   ├── decision_api.py     # Decision lifecycle
│   │   │   ├── alternative_api.py  # Alternative evaluation
│   │   │   ├── review_api.py       # Reviewer assignments & reviews
│   │   │   ├── replay_api.py       # Decision replay engine
│   │   │   ├── audit_api.py        # Structured audit logs + decision trail
│   │   │   ├── approval_chain_api.py # Configurable approval chains
│   │   │   ├── dashboard_api.py    # Dashboard data endpoints
│   │   │   ├── profile_api.py      # User profile management
│   │   │   ├── notification_api.py # In-app notifications
│   │   │   ├── discussion_api.py   # Discussion threads & comments
│   │   │   ├── upload_api.py       # File upload handling
│   │   │   ├── report_api.py       # Report generation
│   │   │   ├── repository_api.py   # Decision repository
│   │   │   ├── settings_api.py     # System settings
│   │   │   └── support_api.py      # Support tickets
│   │   ├── models/                 # SQLAlchemy ORM models (19 models)
│   │   │   ├── user.py             # User accounts
│   │   │   ├── role.py             # User roles
│   │   │   ├── team.py             # Organizational teams
│   │   │   ├── decision.py         # Decision records
│   │   │   ├── decision_version.py # Decision version snapshots
│   │   │   ├── alternative.py      # Evaluated alternatives
│   │   │   ├── review.py           # Reviewer assessments
│   │   │   ├── replay.py           # Decision replay data
│   │   │   ├── audit_log.py        # Structured audit trail (append-only)
│   │   │   ├── activity_log.py     # Legacy activity logs
│   │   │   ├── approval_chain.py   # Approval chain configs
│   │   │   ├── notification.py     # User notifications
│   │   │   ├── comment.py          # Discussion threads & comments
│   │   │   ├── meeting_note.py     # Meeting notes
│   │   │   ├── attachment.py       # File attachments
│   │   │   ├── email_verification.py # OTP verification codes
│   │   │   ├── support_ticket.py   # Support tickets
│   │   │   └── system_setting.py   # System configuration
│   │   ├── services/               # Business logic layer (17 services)
│   │   ├── repositories/           # Data access layer
│   │   ├── schemas/                # Pydantic request/response models
│   │   ├── dependencies/           # FastAPI dependency injection
│   │   │   └── auth.py             # JWT auth & role requirements
│   │   ├── utils/                  # Utility functions
│   │   │   └── diff.py             # Field-level diff engine
│   │   ├── config/                 # Application configuration
│   │   ├── database/               # DB connection & base model
│   │   └── main.py                 # FastAPI app entry point
│   ├── uploads/                    # Uploaded files storage
│   ├── requirements.txt            # Python backend dependencies
│   └── database.db                 # SQLite (development fallback)
├── frontend/
│   ├── app.py                      # Flask application (851 lines)
│   ├── templates/                  # Jinja2 HTML templates (36 pages)
│   │   ├── base.html               # Base layout with navigation
│   │   ├── landing.html            # Public landing page
│   │   ├── login.html              # Login with Remember Me
│   │   ├── register.html           # Multi-step OTP registration
│   │   ├── dashboard.html          # Main dashboard
│   │   ├── admin_dashboard_raw.html # Admin dashboard
│   │   ├── manager_dashboard.html  # Manager dashboard
│   │   ├── employee_dashboard.html # Employee dashboard
│   │   ├── decisions.html          # Decision listing
│   │   ├── create_decision.html    # Decision creation form
│   │   ├── decision_details.html   # Decision detail view
│   │   ├── audit.html              # Audit logs viewer
│   │   ├── replays.html            # Decision replay viewer
│   │   ├── reviews.html            # Reviewer assignments
│   │   ├── users.html              # User management
│   │   ├── roles.html              # Role management
│   │   ├── teams.html              # Team management
│   │   ├── discussion.html         # Discussion threads
│   │   ├── upload.html             # File uploads
│   │   ├── notifications.html      # User notifications
│   │   ├── profile.html            # User profile
│   │   ├── settings.html           # System settings
│   │   ├── support.html            # Support tickets
│   │   └── reports.html            # Report generation
│   ├── static/
│   │   ├── js/                     # JavaScript modules (14 files)
│   │   ├── css/                    # Custom stylesheets
│   │   └── images/                 # Static assets
│   └── requirements.txt            # Python frontend dependencies
├── database/
│   ├── schema.sql                  # Database schema definition
│   ├── seed.sql                    # Sample data seeding
│   └── migrations/
│       └── 001_audit_logs.sql      # Audit log indexes, triggers, RLS
├── docker/
│   ├── Dockerfile.backend          # Backend container image
│   ├── Dockerfile.frontend         # Frontend container image
│   └── docker-compose.yml          # Multi-service orchestration
├── docs/
│   ├── Architecture.pdf            # System architecture document
│   ├── ERDiagram.pdf               # Entity relationship diagram
│   ├── API_Documentation.pdf       # REST API reference
│   └── User_Manual.pdf             # End-user guide
├── EDRP UI/                        # UI mockups and captures
│   ├── index.html                  # Dashboard UI prototype
│   └── *.png / *.pdf               # Dashboard screenshots
└── .gitignore                      # Git ignore rules (includes venv/)
```

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
| `roles` | Role definitions (Admin, Manager, Reviewer, Employee) | Referenced by users |
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

## Installation & Setup

### Prerequisites

- Python 3.10+
- PostgreSQL 15+
- pip (Python package manager)
- Git

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/KoppalaNaveen/EDRP.git
cd EDRP

# Create and activate virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Set up environment variables
# Create backend/.env with:
#   DATABASE_URL=postgresql://user:password@localhost:5432/edrp
#   SECRET_KEY=your-secret-key
#   SMTP_HOST=smtp.gmail.com
#   SMTP_PORT=587
#   SMTP_USER=your-email@gmail.com
#   SMTP_PASS=your-app-password

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --port 8000


cd C:\Users\vi180\OneDrive\Desktop\expertdecision\backend
python -m uvicorn app.main:app --reload --port 8000

```

### Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install frontend dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```

### Access the Application

| Service | URL |
|---------|-----|
| Frontend (Flask) | http://localhost:5000 |
| Backend API (FastAPI) | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |

### Docker Setup

```bash
# Build and start all services
cd docker
docker-compose up --build

# Access the application
# Frontend: http://localhost:5000
# Backend: http://localhost:8000
```

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | Bcrypt via Passlib — passwords never stored in plaintext |
| **JWT Authentication** | Stateless tokens with configurable expiry (72-hour "Remember Me") |
| **Role-Based Access Control** | Four roles with endpoint-level permission checks |
| **Email OTP Verification** | 6-digit codes with expiration before account activation |
| **Admin Approval Workflow** | Accounts remain pending until administrator verification |
| **Append-Only Audit Logs** | PostgreSQL triggers block UPDATE/DELETE on audit_logs |
| **Row-Level Security** | PostgreSQL RLS policies restrict audit log access |
| **Least-Privilege DB Roles** | Separate `edrp_app` role with SELECT/INSERT only |
| **IP & User-Agent Tracking** | Client metadata captured in audit trail |
| **Field-Level Diff Logging** | Every change recorded with before/after values |

---

## Audit Logging System

The audit system provides enterprise-grade compliance tracking:

- **Structured Logs**: Each entry captures actor, action, entity, field-level diffs, IP, and user-agent
- **Append-Only Enforcement**: Database triggers prevent any modification or deletion of audit records
- **Decision Audit Trail**: Full timeline API aggregating versions, reviews, comments, uploads, and audit events
- **Real-Time Dashboard**: 5-second auto-refresh with filtering by entity, actor, action, and date range
- **CSV Export**: One-click export of filtered audit logs for compliance reporting
- **Legacy Backfill**: Migration script carries historical events from activity_logs into audit_logs

---

## Contributors

*

---




## Milestone 3 Deliverables Summary

| Component | Quantity | Details |
|---|:---:|---|
| **Database Tables** | **18** | PostgreSQL 15 schema with RLS, triggers, JSONB, and foreign keys |
| **API Routers** | **20** | FastAPI endpoints on Port 8000 with OpenAPI / Swagger documentation |
| **UI Templates** | **36** | Jinja2 templates styled with Glassmorphism dark theme |
| **ORM Models** | **19** | SQLAlchemy models with cascade rules and relationships |
| **Business Services** | **17** | Decoupled business logic services and repositories |
| **Frontend JS Modules** | **14** | Asynchronous ES6+ modules with Fetch API |
