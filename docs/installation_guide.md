# Installation & Local Setup Guide

This guide walks you through setting up the **Expert Decision Replay Platform** locally on your development machine.

---

## 📋 Prerequisites

*   Python 3.10 or higher installed.
*   Node.js (optional, for advanced extensions).
*   Git installed.
*   PostgreSQL 15 (if running database locally instead of using Docker).
*   Redis server (if running caching locally).

---

## 🛠️ Step-by-Step Local Workspace Setup

### 1. Clone the Codebase & Create Virtual Environment
Clone the repository and initialize a isolated virtual environment:

```bash
# Navigate to the workspace
cd expert_decision_replay_platform

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate
```

### 2. Configure Environment Parameters
Create a `.env` configuration file in the project root:

```bash
cp .env.example .env
```

Review and adjust the parameters inside `.env`:

```env
# Database configuration url (PostgreSQL localhost setup example)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/expert_decision_replay
# Caching redis connection url
REDIS_URL=redis://localhost:6379/0

# Security tokens keys
SECRET_KEY=9e7e72a84a60183b16cf29d665f80b181db5c104e142e0fa525287e07b8b209e
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120

# Directory paths
UPLOAD_DIR=./backend/app/uploads

# Flask configuration endpoints
BACKEND_API_URL=http://localhost:8000
```

### 3. Install Dependencies & Build Backend DB
With the virtual environment active, install packages:

```bash
# Install backend requirements
pip install -r backend/requirements.txt
```

If you do not have PostgreSQL running locally, Uvicorn will automatically fall back to creating and using a local SQLite database (`expert_decision_replay.db` in project root).

Apply Alembic migrations to construct the database schema tables:

```bash
# Execute schema upgrades to HEAD revision
alembic -c backend/alembic.ini upgrade head
```

### 4. Start the FastAPI Backend Server
Launch the Uvicorn ASGI server:

```bash
# Start backend server under port 8000
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

FastAPI server logs will notify you that database tables were successfully initialized and the default categories (**Technology, Finance, HR, Operations, Marketing**) were seeded.

### 5. Start the Flask Frontend Server
In a new terminal window (with virtual environment active):

```bash
# Install frontend packages
pip install -r frontend/requirements.txt

# Start Flask dev server
cd frontend
python app.py
```

---

## 🏁 Verification Check

Open your web browser and load:
*   **Web Application Portal**: [http://localhost:5001](http://localhost:5001) (or `http://localhost:5000` depending on ports override)
*   **Swagger API Sandbox**: [http://localhost:8000/docs](http://localhost:8000/docs)
