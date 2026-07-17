# Expert Decision Replay Platform - Group 5

## Milestone 1 – Project Setup, Authentication & User Management

## Overview

The **Expert Decision Replay Platform** is a centralized web application that enables organizations to document, manage, and review important decisions. The platform helps preserve organizational knowledge by recording decision details, alternatives, discussions, approvals, and outcomes in a structured manner.

This repository contains the implementation of **Milestone 1**, which establishes the project's foundation by setting up the frontend, backend, database, authentication, and user management.

---

## Objectives

- Initialize the project architecture.
- Configure the frontend and backend environments.
- Design the database schema.
- Implement secure user authentication.
- Develop user registration and login functionality.
- Introduce role-based access control.

---

## Features Implemented

### Authentication

- User Registration
- User Login
- JWT-based Authentication
- Password Hashing
- Protected API Endpoints

### User Management

- Employee Registration
- Role Assignment
- User Profile Management
- Role-Based Access Control (RBAC)

### Project Setup

- FastAPI Backend Configuration
- React Frontend Configuration
- PostgreSQL Database Integration
- API Testing using Postman

---

## Technology Stack

### Frontend

- React
- HTML
- CSS
- JavaScript

### Backend

- Python
- FastAPI
- Uvicorn

### Database

- PostgreSQL

### Authentication

- JWT
- OAuth2

### Backend Libraries

- SQLAlchemy
- Alembic
- Pydantic

### Development Tools

- Git
- GitHub
- Postman
- Visual Studio Code

---

## Database

The application uses **PostgreSQL** to store user information securely.

### User Table

- User ID
- Full Name
- Email
- Password (Hashed)
- Role
- Created At

---

## Authentication Flow

1. User registers with valid details.
2. Password is securely hashed before storage.
3. User credentials are stored in PostgreSQL.
4. User logs in using email and password.
5. FastAPI validates the credentials.
6. JWT access token is generated.
7. Protected APIs require a valid JWT token.

---

## Milestone 1 Deliverables

- Project initialized
- Frontend setup completed
- Backend setup completed
- PostgreSQL database configured
- User Registration implemented
- User Login implemented
- JWT Authentication implemented
- User Roles implemented
- API testing completed using Postman