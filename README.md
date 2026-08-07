# Expert Decision Replay Platform (EDRP)

A centralized platform for organizations to record, manage, review, and preserve important business decisions. The platform captures the complete decision-making lifecycle including problem statements, alternatives, discussions, approvals, supporting documents, and final outcomes, ensuring organizational knowledge is retained and past decisions can be revisited for future reference.

Developed as part of the **Infosys Springboard Virtual Internship**.

---

# Tech Stack

## Backend
- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- JWT Authentication
- Passlib (Password Hashing)
- Pydantic
- Uvicorn

## Frontend
- React
- Vite
- Axios
- React Router

## Database
- PostgreSQL (Neon Cloud)

## File Storage
- Backblaze B2 Cloud Storage

---

# Project Structure

```text
Expert-Decision-Replay-Platform-Group-2/
│
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── database.py
│   ├── uploads.py
│   ├── b2_service.py
│   ├── notifications.py
│   ├── audit_helper.py
│   ├── crud_discussion.py
│   ├── discussion.py
│   ├── alembic/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── AppShell.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── DecisionsList.jsx
│   │   ├── DecisionCard.jsx
│   │   ├── DecisionDetails.jsx
│   │   ├── ApprovalHistory.jsx
│   │   ├── VersionHistory.jsx
│   │   ├── ReportsPage.jsx
│   │   ├── NotificationsPage.jsx
│   │   └── ...
│   └── package.json
│
├── README.md
└── .gitignore
```

---

# Setup Instructions

## Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside the **backend** folder.

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
SECRET_KEY=<your-secret-key>

B2_KEY_ID=<your-backblaze-key-id>
B2_APPLICATION_KEY=<your-backblaze-application-key>
B2_BUCKET_NAME=<your-backblaze-bucket-name>
```

Run migrations

```bash
alembic upgrade head
```

Start the backend

```bash
uvicorn main:app --reload
```

Backend URL

```
http://127.0.0.1:8000
```

Swagger Documentation

```
http://127.0.0.1:8000/docs
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend URL

```
http://localhost:5173
```

---

# Features by Milestone

---

# Milestone 1 – Foundation

### Authentication & Authorization

- User Registration
- User Login
- JWT Authentication
- Password Hashing using bcrypt
- Role-Based Access Control (RBAC)

Supported Roles

- Employee
- Reviewer
- Manager
- Admin

Security Features

- Passwords stored in hashed format
- JWT Bearer Authentication
- Roles cannot be self-assigned
- Every new user is registered as Employee by default
- Only Admins can promote user roles

---

# Milestone 2 – Core Decision Management

## Decision Management

- Create Decision
- View Decision
- Edit Decision
- Archive Decision
- Delete Decision
- Decision Categories
- Decision Lifecycle

Decision Statuses

- Draft
- Under Review
- Approved
- Rejected
- Archived

---

## Alternative Comparison

Compare multiple alternatives for a decision.

Each alternative stores

- Title
- Description
- Pros
- Cons
- Cost
- Risk Level
- Feasibility

Features

- Create Alternative
- Update Alternative
- Delete Alternative
- Compare Alternatives

---

## Discussion Module

- Threaded Discussions
- Replies
- Meeting Notes
- Attachments
- Decision Collaboration

---

## File Upload

- Upload supporting files
- Backblaze B2 Cloud Storage
- Download attachments
- Secure file access

---

## Version Tracking

Every modification to a decision creates a version snapshot.

Features

- Complete Version History
- Restore Previous Versions
- Track Decision Evolution

---

## Decision Export

- Export Individual Decision as PDF

---

# Milestone 3 – Workflow & Reporting

## Multi-Level Approval Workflow

- Reviewer Approval
- Manager/Admin Final Approval
- Approval History
- Mandatory rejection comments
- Decision resubmission after edits

---

## Reviewer Assignment

- Admin assigns Reviewers
- Category-based reviewer allocation
- Automatic reviewer assignment

---

## Escalation Workflow

- Identify overdue decisions
- Escalation tracking
- Configurable review duration

---

## Notifications

Real-time notifications for

- Decision Creation
- Approval Updates
- Review Assignment
- Status Changes

---

## Audit Logging

Tracks important activities

- User Login
- Decision Creation
- Decision Updates
- Approvals
- Role Changes
- Other significant actions

---

## Reports

Professional reporting module including

### Decision Reports

- PDF Export
- Excel Export
- Executive Summary
- Decision Statistics
- Category Summary
- Professional formatting

### Approval Reports

- PDF Export
- Excel Export
- Approval Statistics
- Approval Level Summary
- Executive Summary

### Audit Reports

- PDF Export
- Excel Export
- Audit Summary
- Action Statistics
- User Activity
- Recent Audit Events

Reporting Features

- Professional PDF Layout
- Executive Summary
- Generated Date & Time
- Generated By
- Styled Tables
- Headers & Footers
- Page Numbers
- Multiple Excel Worksheets
- Auto-sized Columns
- Freeze Panes
- Filters

---

## Dashboards

Role-based dashboards

### Employee

- My Decisions
- Draft Decisions
- Under Review
- Approved
- Rejected
- Archived

### Reviewer

- Pending Reviews
- Approved Reviews
- Rejected Reviews

### Manager

- Decision Statistics
- Pending Approvals
- Team Activity

### Admin

- User Statistics
- Decision Analytics
- Role Distribution
- Audit Insights
- Reports Dashboard

Dashboard Features

- Bar Charts
- Line Charts
- Donut Charts
- Decision Statistics
- Activity Trends

---

## Search & Filtering

- Decision Search
- User Search
- Category Filter
- Status Filter
- Pagination

---

# Database

Current database entities include

- Users
- Decisions
- Alternatives
- Discussions
- Approvals
- Notifications
- Audit Logs
- Version History

Relationships

- One User → Many Decisions
- One Decision → Many Alternatives
- One Decision → Many Discussions
- One Decision → Many Versions
- One User → Many Audit Logs

---

# API Documentation

Interactive Swagger Documentation

```
http://127.0.0.1:8000/docs
```

---

# Security Notes

- JWT Authentication
- Password Hashing using bcrypt
- Role-Based Authorization
- Secure API Access
- Environment Variables stored in `.env`
- `.env` excluded using `.gitignore`
- Self-approval prevention
- Secure attachment access

---

# Team

Developed collaboratively by **Group 2** as part of the **Infosys Springboard Virtual Internship**.

Major project modules include

- Authentication & Authorization
- Decision Management
- Alternative Comparison
- Discussion Module
- File Upload
- Version Tracking
- Approval Workflow
- Notifications
- Audit Logging
- Dashboards
- Reporting Module

---

# Future Enhancements

- Unit Testing using pytest
- Enhanced Swagger Documentation
- Performance Optimization
- Advanced Approval Hierarchy
- Frontend Escalation Dashboard
- Email Notifications
- Analytics Dashboard
- Mobile Responsive Enhancements

---

# License

This project was developed for academic and internship purposes as part of the **Infosys Springboard Virtual Internship Program**.