# Expert Decision Replay Platform

The **Expert Decision Replay Platform** is a centralized web application designed to document, compare, discuss, approve, and audit critical organizational decisions. It acts as a digital ledger for decision-making, preserving institutional knowledge to prevent the duplication of past mistakes and accelerate training.

---

## 🚀 Key Features

*   **User Management**: Secure role-based access control (RBAC) supporting **Employee, Reviewer, Manager, and Administrator** roles, with department/team mappings.
*   **Decision Workspace**: Capture rich metadata including problem statement context, evaluation criteria, and version tracking logs.
*   **Alternative Analysis**: Side-by-side comparison tables including pros/cons lists, risk assessments, feasibility ratings, and cost estimates.
*   **Approval Workflows**: Multi-stage review assignments with history logging, remarks, and email-style notifications feed.
*   **Collaboration Discussions**: Threaded comment threads enabling design feedback, attaching files, and highlighting formal meeting notes.
*   **Audit Logging**: Compliance trail tracking security events (registrations, logins), actions (creation, comment updates), and data exports.
*   **Interactive Dashboards**: Real-time statistical charts, system alerts, and inbox feeds customized by role.
*   **Reports & Export**: Generating and exporting detailed decision files as **PDF reports** and spreadsheet records as **Excel sheets**.

---

## 🛠️ Technology Stack

*   **Backend**: Python, FastAPI, SQLAlchemy, Alembic, Uvicorn, Pydantic
*   **Frontend**: Flask, HTML5, Vanilla CSS, Jinja2, JavaScript (Fetch API, Bootstrap 5)
*   **Database**: PostgreSQL 15, SQLite (test/local fallback)
*   **Cache / Messaging**: Redis 7
*   **DevOps**: Docker, Docker Compose

---

## 📂 Folder Structure

```text
expert_decision_replay_platform/
├── backend/
│   ├── app/
│   │   ├── core/           # Config settings and security keys
│   │   ├── database/       # DB session connections and alembic base
│   │   ├── models/         # SQLAlchemy DB models mapping
│   │   ├── routers/        # FastAPI endpoint path definitions
│   │   ├── schemas/        # Pydantic data validation types
│   │   ├── services/       # DB operation services and business rules
│   │   ├── uploads/        # Local attachments data folder
│   │   └── utils/          # PDF/Excel generator helper modules
│   ├── alembic/            # Database schema migration versions
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── static/             # Assets and custom CSS styles
│   ├── templates/          # Jinja2 layouts and components
│   ├── app.py              # Flask server routing
│   ├── Dockerfile
│   └── requirements.txt
├── docs/                   # Full documentation guides
├── docker-compose.yml      # Service containers orchestration
└── README.md               # Main instructions readme
```

---

## 📖 Complete Documentation Catalog

We have prepared comprehensive guides for each phase of setup, development, and usage inside the **`docs/`** directory:

1.  **[Installation & Local Setup](file:///Users/radhikaapatil/.gemini/antigravity-ide/scratch/expert_decision_replay_platform/docs/installation_guide.md)**: Setting up virtual environments, database connections, and running servers locally.
2.  **[User Manual / Operations Guide](file:///Users/radhikaapatil/.gemini/antigravity-ide/scratch/expert_decision_replay_platform/docs/user_manual.md)**: Step-by-step role-based operational walkthroughs.
3.  **[Developer Guide & Code Architecture](file:///Users/radhikaapatil/.gemini/antigravity-ide/scratch/expert_decision_replay_platform/docs/developer_guide.md)**: Deep dive into database schemas, models mapping, and code flows.
4.  **[REST API Documentation](file:///Users/radhikaapatil/.gemini/antigravity-ide/scratch/expert_decision_replay_platform/docs/api_documentation.md)**: Complete endpoint inputs, outputs, and validation details.
5.  **[Docker Deployment Guide](file:///Users/radhikaapatil/.gemini/antigravity-ide/scratch/expert_decision_replay_platform/docs/deployment_guide.md)**: Running containerized configurations on staging or production.
6.  **[Troubleshooting & Recovery](file:///Users/radhikaapatil/.gemini/antigravity-ide/scratch/expert_decision_replay_platform/docs/troubleshooting_guide.md)**: Fixing connection issues, cache locks, and permission alerts.
7.  **[Professional Presentation Slides](file:///Users/radhikaapatil/.gemini/antigravity-ide/scratch/expert_decision_replay_platform/docs/presentation.md)**: Pitch deck outline for organizational review.

---

## ⚡ Quick Start (Docker Compose)

Spin up the entire application stack in under a minute:

```bash
# Build and run all container services
docker compose up -build -d

# Verify all services are running healthy
docker compose ps
```

*   **Flask Frontend Web App**: Access at [http://localhost:5001](http://localhost:5001)
*   **FastAPI REST Swagger Docs**: Access at [http://localhost:8000/docs](http://localhost:8000/docs)
