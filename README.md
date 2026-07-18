# Expert Decision Replay Platform

Backend implementation for the Expert Decision Replay Platform developed during the Infosys Springboard Internship.

## Tech Stack

- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- JWT Authentication
- Passlib (Password Hashing)

## Features

- User Registration
- User Login
- JWT Authentication
- Role-Based Authorization
- Decision Management (Upcoming)

## Installation

```bash
python -m venv venv
```

Activate the virtual environment.

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn main:app --reload
```

Open Swagger:

```
http://127.0.0.1:8000/docs
```