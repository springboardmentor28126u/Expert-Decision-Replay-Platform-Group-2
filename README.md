# Expert Decision Replay Platform

A production-quality platform for recording and replaying organizational decisions, preserving institutional knowledge for future employees.

---

## Technical Stack
- **Backend:** Python (3.11+), FastAPI, SQLAlchemy (2.0), Alembic, Pydantic (2.0), Uvicorn
- **Database:** PostgreSQL (Neon Serverless)
- **Frontend:** React (19), TypeScript, Vite, TailwindCSS (v4), Axios, React Router (v7)

---

## Repository Structure

```
Expert-Decision-Replay-Platform-Group-2/
├── backend/
│   ├── alembic/                # DB migrations directory
│   ├── app/
│   │   ├── auth/               # JWT & bcrypt security handlers
│   │   ├── exceptions/         # API HTTP exception mappings
│   │   ├── middleware/         # Logging and exception catching middlewares
│   │   ├── models/             # SQLAlchemy data mapping models
│   │   ├── repositories/       # Generic Base and model data layer classes (DAL)
│   │   ├── routers/            # API routing layer definitions
│   │   ├── schemas/            # Pydantic typing and validation shapes
│   │   ├── services/           # Domain business operations layer
│   │   └── storage/            # Pluggable Local/S3 upload backend storage
│   ├── uploads/                # Local files directory (ignored by git)
│   ├── alembic.ini
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                # Global Axios client and module endpoints
│   │   ├── components/         # Reusable layouts, cards, inputs, dialogs
│   │   ├── contexts/           # Global Authentication context state (AuthProvider)
│   │   ├── hooks/              # Custom utilities hooks
│   │   ├── pages/              # Login, register, dashboard, detail view sheets
│   │   ├── types/              # Unified TypeScript mappings
│   │   └── utils/              # Status/roles lists & formatters
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── LICENSE
└── README.md
```

---

## Local Setup & Deployment

### 1. Database Migrations
The database schema uses a **shared Neon PostgreSQL connection**. All columns added for Milestone 2 features are introduced through a safe, additive Alembic migration.

To run migrations:
```bash
cd backend
pip install -r requirements.txt

# Run migrations to update the shared schema (adds pros, cons, feasibility columns, etc.)
alembic upgrade head
```

### 2. Start the Backend API
You can run the FastAPI server locally:
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Documentation is available at: `http://localhost:8000/docs`
- Health check endpoints are at: `http://localhost:8000/api/health`

### 3. Start the Frontend Application
Run the React development server:
```bash
cd frontend
npm install
npm run dev
```
- The application will be accessible at: `http://localhost:5173`

---

## Features Implemented (Milestone 1 & 2)

1. **Authentication & User Management**
   - User registration & login with password hashing (bcrypt).
   - OAuth2 password bearer flow returning secure JWT access tokens.
   - Role-based authorization: **Employee**, **Reviewer**, **Manager**, **Administrator**.
   - Admin panel for managing users and modifying organizational roles.

2. **Decision Log & Lifecycle Tracking**
   - Log decisions with title, category, description, and status tags.
   - Status flows: **Draft**, **Under Review**, **Approved**, **Rejected**, and **Archived**.
   - Automatic version tracking: edits to decisions log a historical record tracking the user, timestamp, previous field values, and modified columns.

3. **Alternative Comparison Matrix**
   - Attach multiple alternative solutions to any logged decision.
   - Compare cost, quality, risk, and feasibility scores.
   - Track advantages (pros) and disadvantages (cons) for each option.
   - Beautiful visual evaluation score metrics bar chart summary.

4. **Threaded Discussion Module**
   - Comment feed for discussion with nested/threaded reply features.
   - Differentiate entries by: comments, meeting notes, and formal decision rationales.

5. **Document Attachments**
   - Pluggable storage architecture. Upload documents attached to decisions.
   - Automatically stores files locally with paths saved to database metadata. Easily swaps to AWS S3 by providing a new StorageBackend implementation class.