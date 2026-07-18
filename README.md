# Expert Decision Replay Platform

A centralized enterprise platform where organizations record, review, approve, and analyze important decisions.

## Week 1 Milestone - Project Structure & Setup

This repository contains the foundational code for the Expert Decision Replay Platform. It implements a complete FastAPI backend with PostgreSQL and a React frontend utilizing Tailwind CSS and Shadcn UI.

### Folder Structure

```
.
├── backend/                  # FastAPI Application
│   ├── alembic/              # Database Migrations
│   ├── app/                  # Main Application Code
│   │   ├── api/              # API Routers & Dependencies
│   │   ├── core/             # Configuration & Security
│   │   ├── database/         # Database Sessions & Base
│   │   ├── middleware/       # Request Logging & Rate Limiting
│   │   ├── models/           # SQLAlchemy Models
│   │   ├── schemas/          # Pydantic Schemas
│   │   ├── services/         # Business Logic
│   │   └── utils/            # Utilities & Validators
│   ├── main.py               # Application Entrypoint
│   └── requirements.txt      # Python Dependencies
├── frontend/                 # React Frontend Application
│   ├── src/                  # Source Code
│   │   ├── components/       # UI & Layout Components
│   │   ├── contexts/         # React Contexts (Auth, Theme)
│   │   ├── hooks/            # Custom Hooks
│   │   ├── pages/            # Page Components
│   │   ├── services/         # API Integration
│   │   └── types/            # TypeScript Interfaces
│   ├── index.html            # HTML Entrypoint
│   ├── package.json          # Node Dependencies
│   ├── tailwind.config.js    # Tailwind Configuration
│   └── vite.config.ts        # Vite Configuration
└── docs/                     # Project Documentation
    ├── requirements.md       # Requirements & Architecture
    └── postman_collection.json # API Testing Collection
```

### Features Implemented
- **Backend**:
  - FastAPI setup with Clean Architecture
  - SQLAlchemy models for Users, Roles, Teams, and Profiles
  - JWT Authentication (Access + Refresh tokens)
  - Role-based Access Control (RBAC) middleware
  - Alembic migrations for DB schema
- **Frontend**:
  - React 19 + Vite + TypeScript
  - Tailwind CSS + Shadcn UI integration
  - Dark/Light mode theme switching
  - Auth context and protected routes
  - Login, Register, and Dashboard pages

---

## Local Setup Instructions

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL database server running locally (or Docker)
- Redis server running locally (or Docker)

### 1. Database Setup
Create a PostgreSQL database named `expert_decision_db` and ensure Redis is running on port 6379.

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload
```

The API documentation will be available at `http://localhost:8000/docs`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)
- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://postgres:postgres@localhost:5432/expert_decision_db`)
- `REDIS_URL`: Redis connection string (e.g., `redis://localhost:6379/0`)
- `SECRET_KEY`: JWT signing key
- `CORS_ORIGINS`: Allowed origins (e.g., `http://localhost:5173,http://localhost:3000`)

### Frontend (`frontend/.env` - optional)
- `VITE_API_URL`: Backend API URL (defaults to `http://localhost:8000/api/v1` in `src/services/api.ts`)

---

## API Documentation

- Interactive Swagger UI: `http://localhost:8000/docs`
- ReDoc UI: `http://localhost:8000/redoc`
- A Postman collection is also provided in the `docs/` directory for manual testing.