# Expert Decision Replay Platform - Group 5

# Milestone 1 & Milestone 2

---

## Overview

The **Expert Decision Replay Platform (EDRP)** is a centralized web application that enables organizations to document, manage, review, and track important business decisions.

The platform preserves organizational knowledge by recording decisions, alternatives, discussions, supporting documents, version history, and reports in a structured and collaborative environment.

This repository contains the implementation of:

- Milestone 1 – Project Setup, Authentication & User Management
- Milestone 2 – Decision Management & Collaboration Features

---

# Milestone 1 – Project Setup, Authentication & User Management

## Objectives

- Initialize project architecture
- Configure frontend and backend
- Design PostgreSQL database
- Implement JWT Authentication
- Develop User Registration & Login
- Implement Role-Based Access Control (RBAC)

---

## Features Implemented

### Authentication

- User Registration
- User Login
- JWT Authentication
- Password Hashing
- Protected API Endpoints

### User Management

- User Registration
- User Profiles
- Role Assignment
- Role-Based Access Control

### Project Setup

- FastAPI Backend
- React Frontend
- PostgreSQL Database
- API Testing using Postman

---

# Milestone 2 – Decision Management & Collaboration

## Objectives

- Develop Decision Management Module
- Implement Alternative Analysis
- Build Repository for Documents
- Create Discussion Module
- Implement Version History
- Generate Reports Dashboard

---

## Features Implemented

### Decision Management

- Create Decision
- Edit Decision
- Delete Decision
- Decision Details
- Decision Status Management
- View Decision

Supported Decision Status

- Draft
- Under Review
- Approved
- Rejected
- Archived

---

### Alternative Analysis

- Add Alternatives
- Edit Alternatives
- Delete Alternatives
- Compare Alternatives
- Cost Comparison
- Risk Assessment
- Feasibility Analysis
- Pros & Cons

---

### Repository

- Upload Documents
- Download Documents
- View Repository Files
- Delete Documents

---

### Discussion Module

- Add Comments
- Discussion Threads
- Meeting Notes
- Decision Rationale
- File Attachments

---

### Version History

- View Decision Versions
- Track Changes
- Version Records
- Restore Previous Information

---

### Reports Dashboard

- Total Decisions
- Approved Decisions
- Pending Decisions
- Rejected Decisions
- Total Alternatives
- Uploaded Documents
- Discussion Count
- Version Records
- Recent Decision Activity

---

### Dashboard

- Statistics Cards
- Recent Decisions Table
- Navigation Sidebar
- User Profile
- Logout

---

# Technology Stack

## Frontend

- React
- HTML
- CSS
- JavaScript
- Axios
- React Router DOM

## Backend

- Python
- FastAPI
- Uvicorn

## Database

- PostgreSQL

## Authentication

- JWT
- OAuth2

## ORM

- SQLAlchemy

## Validation

- Pydantic

## Development Tools

- Git
- GitHub
- Postman
- Visual Studio Code

---

# Database Modules

## User

- User ID
- Full Name
- Email
- Password
- Role
- Created At

## Decision

- Decision Title
- Description
- Category
- Status
- Created By
- Created Date

## Alternative

- Alternative Name
- Pros
- Cons
- Cost
- Risk
- Feasibility

## Repository

- File Name
- File Path
- Decision ID

## Discussion

- Comments
- Discussion Thread
- Meeting Notes

## Version History

- Version Number
- Updated By
- Updated Date

---

# Authentication Flow

1. User registers.
2. Password is hashed.
3. Data stored in PostgreSQL.
4. User logs in.
5. JWT Token generated.
6. Protected APIs require JWT.
7. User accesses dashboard according to role.

---

# Project Structure

```
backend/
│
├── app
│   ├── routers
│   ├── models
│   ├── schemas
│   ├── crud
│   ├── utils
│   ├── config.py
│   └── main.py
│
frontend/
│
├── src
│   ├── components
│   ├── services
│   ├── styles
│   ├── App.jsx
│   └── main.jsx
```

---

# Milestone 1 Deliverables

- Project Initialization
- React Setup
- FastAPI Setup
- PostgreSQL Configuration
- User Registration
- User Login
- JWT Authentication
- Role-Based Access Control
- API Testing

---

# Milestone 2 Deliverables

- Decision Management
- Alternative Analysis
- Repository Module
- Discussion Module
- Version History
- Reports Module
- Dashboard Statistics
- Document Management
- Collaboration Features

---

# Future Enhancements

- Email Notifications
- Decision Analytics
- AI Recommendation Engine
- Audit Logs
- Workflow Automation
- Cloud Storage Integration
- Advanced Search & Filters

---

# Developed By

**Group 5**

Expert Decision Replay Platform

Infosys Springboard Internship Project