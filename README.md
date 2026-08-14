# Expert Decision Replay Platform

This project contains a FastAPI backend and a React + Vite frontend for managing decision records, approvals, reports, and audit logs.

## Features
- User authentication and registration
- Decision management workflow
- Approval tracking
- Comments, alternatives, and document uploads
- Audit and reporting views

## Backend setup
1. Open the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment if needed.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the API server:
   ```bash
   .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
5. Verify health:
   ```bash
   http://127.0.0.1:8000/health
   ```

## Frontend setup
1. Open the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev -- --host 127.0.0.1 --port 5173
   ```
4. Open the app at:
   ```text
   http://127.0.0.1:5173/
   ```

## Notes
- The backend now reads its database configuration from the backend .env file.
- Authentication and registration are configured to work with the current Neon PostgreSQL database setup.
- The frontend uses the backend API at http://127.0.0.1:8000.
