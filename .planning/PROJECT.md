# Expert Decision Replay Platform

## Overview
Enterprise platform where organizations record, review, approve, and analyze important decisions.

## Tech Stack
- **Backend:** FastAPI + SQLAlchemy + PostgreSQL (Neon cloud or local)
- **Frontend:** React + Vite
- **Auth:** JWT tokens with Redis blacklisting
- **Database Migrations:** Alembic

## Current Status
Three group-related API endpoints return 500 Internal Server Error:
1. `GET /api/v1/groups/my?company_id=...`
2. `GET /api/v1/admin/groups`
3. `POST /api/v1/admin/groups`

Root cause identified: Global exception handler catches HTTPException and converts to 500.
