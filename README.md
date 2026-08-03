# Expert Decision Replay Platform

Centralized platform for recording, reviewing, and auditing organizational decisions, developed during the **Infosys Springboard Virtual Internship**.

The platform enables organizations to create, evaluate, compare, review, and manage business decisions through a role-based workflow.

---

# Tech Stack

- FastAPI (async)
- SQLAlchemy 2.0 (async ORM)
- PostgreSQL
- Alembic
- JWT Authentication
- Passlib (Password Hashing)
- Pydantic v2
- Uvicorn

---

# Features

## Authentication & Authorization

- User Registration & Login
- JWT Authentication (access + refresh tokens)
- Password Hashing
- Role-Based Access Control (RBAC), backed by a `roles` table

Supported Roles:

- Employee
- Reviewer
- Manager
- Administrator

## Decision Management

- Create / View / List / Update Decisions
- Decision Categories
- Decision Lifecycle & Version History

Decision Statuses:

- Draft
- Under Review
- Approved
- Rejected
- Archived

## Alternative Comparison Module

Employees can evaluate multiple alternatives for a decision (title, description, pros/cons, cost, risk level, feasibility) and compare them side by side.

## Approval Workflow

Multi-level reviewer assignment with approve / reject / escalate actions and full approval history per decision.

## Discussion & Comments

Threaded comments per decision (optionally scoped to an alternative), including meeting-note entries, with file attachments.

## Attachments

File uploads attached to a decision, alternative, or comment.

## Notifications & Audit Log

- In-app notifications for decision/approval events
- Full audit trail of actions taken on decisions

## Dashboard Module

Role-aware dashboard providing insights tailored to the signed-in user:

- Decision status counts (draft / under review / approved / rejected / archived)
- Recent decisions
- Administrator view: total users, active users, user counts by role, total alternatives

---

# Running the backend

```bash
cd backend
uvicorn app.main:app --reload
```

API docs are served at `/api/v1/docs` (see `app/config.py` for `API_V1_PREFIX`).

Run migrations:

```bash
alembic upgrade head
```
