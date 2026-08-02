# Expert Decision Replay Platform

Backend implementation for the **Expert Decision Replay Platform** developed during the **Infosys Springboard Virtual Internship**.

The platform enables organizations to create, evaluate, compare, review, and manage business decisions through a role-based workflow.

---

# Tech Stack

- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- JWT Authentication
- Passlib (Password Hashing)
- Pydantic
- Uvicorn

---

# Features

## Authentication & Authorization

- User Registration
- User Login
- JWT Authentication
- Password Hashing
- Role-Based Access Control (RBAC)

Supported Roles:

- Employee
- Reviewer
- Manager
- Admin

---

## Decision Management

- Create Decision
- View Decision
- List Decisions
- Update Decision Status
- Decision Categories
- Decision Lifecycle

Decision Statuses:

- Draft
- Under Review
- Approved
- Rejected
- Archived

---

## Alternative Comparison Module

Employees can evaluate multiple alternatives for a decision.

Features:

- Create Alternative
- View Alternative
- Update Alternative
- Delete Alternative
- List Alternatives for a Decision
- Compare Alternatives

Alternative Attributes:

- Title
- Description
- Pros
- Cons
- Cost
- Risk Level
- Feasibility

---

## Dashboard Module

Role-based dashboards provide insights tailored to different users.

### Employee Dashboard

- My Decisions
- Draft Decisions
- Under Review Decisions
- Approved Decisions
- Rejected Decisions
- Archived Decisions
- Recent Decisions

### Reviewer Dashboard

- Under Review Decisions
- Approved Decisions
- Rejected Decisions
- Recent Under Review Decisions

### Manager Dashboard

- Total Decisions
- Decision Statistics
- Recent Decisions

### Admin Dashboard

- Total Users
- Active Users
- User Role Statistics
- Total Alternatives
- Decision Statistics
- Recent Decisions

---

# Database

Current database entities:

- Users
- Decisions
- Alternatives

Relationships:

- One User → Many Decisions
- One Decision → Many Alternatives

---

# API Documentation

Run the backend:

```bash
uvicorn main:app --reload