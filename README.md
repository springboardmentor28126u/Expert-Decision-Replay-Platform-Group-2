# ðŸ§  Expert Decision Replay Platform (EDRP)

<p align="center">
  <strong>A centralized enterprise platform for capturing, managing, reviewing, approving, discussing, analyzing, and replaying business decisions.</strong>
</p>

<p align="center">
  <img src="docs/screenshots/04-dashboard.png" alt="EDRP Dashboard" width="900">
</p>

<p align="center">
  <strong>Expert Decision Replay Platform</strong><br>
  Enterprise Decision Management â€¢ Approval Workflow â€¢ Knowledge â€¢ Analytics â€¢ Auditability â€¢ AI Assistance
</p>

---

## ðŸ“Œ Project Information

| Item | Details |
|---|---|
| **Project Name** | Expert Decision Replay Platform |
| **Short Name** | EDRP |
| **Repository** | `Expert-Decision-Replay-Platform-Group-2` |
| **Project Type** | Enterprise Decision Management Web Application |
| **Backend** | Python + FastAPI |
| **Database** | PostgreSQL |
| **Frontend** | HTML + CSS + JavaScript + Jinja2 |
| **AI Integration** | Ollama-compatible local LLM |
| **Deployment** | Docker / Docker Compose |
| **API Server** | Uvicorn |
| **API Version** | FastAPI application v1.0 |

> **Note:** This README is based on the project structure and implementation files in the supplied EDRP project, together with the application screens shared during development.

---



# ðŸŒŸ 1. What is EDRP?

The **Expert Decision Replay Platform (EDRP)** is an enterprise-oriented web application designed to make organizational decision-making **structured, traceable, collaborative, and reviewable**.

Instead of keeping important decisions scattered across emails, documents, spreadsheets, and conversations, EDRP brings the decision lifecycle into one workspace.

### The platform helps an organization:

- ðŸ“ Create and manage business decisions
- ðŸ”„ Track decision versions and changes
- âš–ï¸ Evaluate and compare alternatives
- âœ… Manage approval workflows
- ðŸ’¬ Conduct decision-related discussions
- ðŸ“š Maintain reusable organizational knowledge
- ðŸ“Š Generate reports and analytics
- ðŸ” Maintain audit logs
- ðŸ”” Manage notifications
- ðŸ“Ž Store decision attachments
- ðŸ¤– Ask an AI Agent questions using available EDRP data
- ðŸ‘¥ Manage users and profiles

---

# ðŸŽ¯ 2. Project Objectives

The major objectives of EDRP are:

1. **Centralize enterprise decisions** in a single platform.
2. **Improve decision traceability** by maintaining versions and history.
3. **Formalize approval workflows** and approval status.
4. **Support collaboration** through discussions and comments.
5. **Preserve organizational knowledge** for future decisions.
6. **Compare alternatives** using structured analysis.
7. **Provide management reports** for decision and approval information.
8. **Maintain accountability** through audit logging.
9. **Support AI-assisted decision analysis** using the application's decision context.
10. **Provide a clean enterprise dashboard** for quick operational visibility.

---

# ðŸ§© 3. Main Modules

| # | Module | Purpose |
|---|---|---|
| 01 | ðŸ” **Authentication** | Login, registration, forgot-password and password recovery workflows. |
| 02 | ðŸ  **Dashboard** | Provides a centralized overview of decisions, approvals, discussions, users, trends, and summaries. |
| 03 | ðŸ“‹ **Decision Management** | Create, view, edit, filter, delete, and track enterprise decisions. |
| 04 | ðŸ”„ **Decision Version History** | Records decision changes so previous versions and decision evolution can be reviewed. |
| 05 | âž• **Create Decision** | Provides the form used to capture a new enterprise decision and its required details. |
| 06 | âœ… **Approval Management** | Tracks approvers, approval status, comments, escalation information, and approval/rejection actions. |
| 07 | ðŸ’¬ **Discussion Management** | Allows users to create and manage decision-related discussions and comments. |
| 08 | ðŸ“š **Knowledge Repository** | Stores reusable organizational knowledge and supporting information for future decisions. |
| 09 | âš–ï¸ **Alternative Analysis** | Supports structured comparison and evaluation of alternative options. |
| 10 | ðŸ¤– **AI Agent** | Provides decision-related AI assistance using available EDRP context. |
| 11 | ðŸ“Š **Reports & Analytics** | Provides reporting, summaries, analytics, and export-related functionality. |
| 12 | ðŸ” **Audit Logs** | Records important system activity for traceability and accountability. |
| 13 | ðŸ‘¥ **User Management** | Supports administrative user management and role-related operations. |
| 14 | ðŸ‘¤ **My Profile** | Provides user profile information and profile-related operations. |
| 15 | ðŸ“§ **Email Notifications** | Sends email notifications for important workflow events such as escalated or overdue approvals. |
| 16 | ðŸ“Ž **Attachments** | Handles files associated with application records. |

# ðŸ”„ 4. Decision Lifecycle

```text
                     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                     â”‚  Create Decision  â”‚
                     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â”‚
                               â–¼
                     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                     â”‚  Draft Decision   â”‚
                     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â”‚
                               â–¼
                 â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                 â”‚ Alternative Analysis       â”‚
                 â”‚ Compare available options  â”‚
                 â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â”‚
                               â–¼
                     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                     â”‚ Approval Workflowâ”‚
                     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â”‚
                 â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                 â–¼                           â–¼
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚     Approved    â”‚          â”‚     Rejected    â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜          â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                 â”‚                            â”‚
                 â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                â–¼
                     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                     â”‚ Version / Audit    â”‚
                     â”‚ History & Replay   â”‚
                     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â”‚
                               â–¼
                     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                     â”‚ Reports / Knowledgeâ”‚
                     â”‚ / AI Assistance    â”‚
                     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

# âš™ï¸ Project Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd Expert-Decision-Replay-Platform-Group-2
```

### 2. Open the backend

```powershell
cd backend
```

### 3. Create and activate the Python virtual environment

If the virtual environment does not already exist:

```powershell
python -m venv venv
```

Activate it on Windows PowerShell:

```powershell
.\venv\Scripts\activate
```

### 4. Install the backend dependencies

```powershell
pip install -r requirements.txt
```

### 5. Start the FastAPI backend

```powershell
uvicorn app.main:app --reload
```

The backend will run locally at the address displayed by Uvicorn, typically `http://127.0.0.1:8000`.

# ðŸ—ï¸ 5. System Architecture

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    EDRP Web Interface                       â”‚
â”‚                                                             â”‚
â”‚ HTML Templates â”‚ CSS â”‚ JavaScript â”‚ Jinja2                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚ HTTP / JSON
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     FastAPI Backend                         â”‚
â”‚                                                             â”‚
â”‚ Users â”‚ Decisions â”‚ Approvals â”‚ Discussions â”‚ Knowledge    â”‚
â”‚ Reports â”‚ Alternatives â”‚ Versions â”‚ Audit â”‚ Notifications â”‚
â”‚ Attachments â”‚ AI Agent                                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                â”‚                              â”‚
                â–¼                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚       PostgreSQL         â”‚       â”‚       Ollama / LLM       â”‚
â”‚                          â”‚       â”‚                          â”‚
â”‚ Decisions               â”‚       â”‚ AI Agent                 â”‚
â”‚ Approvals               â”‚       â”‚ Decision context         â”‚
â”‚ Discussions             â”‚       â”‚ Alternatives             â”‚
â”‚ Knowledge               â”‚       â”‚ Approvals                â”‚
â”‚ Users / Audit / etc.    â”‚       â”‚ Versions / Audit         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

# ðŸ“ 6. Project Structure

The following structure reflects the supplied project:

```text
Expert-Decision-Replay-Platform-Group-2/
â”‚
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ ai/
â”‚   â”‚   â”‚   â”œâ”€â”€ __init__.py
â”‚   â”‚   â”‚   â”œâ”€â”€ agent.py
â”‚   â”‚   â”‚   â”œâ”€â”€ prompts.py
â”‚   â”‚   â”‚   â”œâ”€â”€ service.py
â”‚   â”‚   â”‚   â””â”€â”€ tools.py
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ routers/
â”‚   â”‚   â”‚   â”œâ”€â”€ ai_agent.py
â”‚   â”‚   â”‚   â”œâ”€â”€ alternative.py
â”‚   â”‚   â”‚   â”œâ”€â”€ approvals.py
â”‚   â”‚   â”‚   â”œâ”€â”€ audit.py
â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard.py
â”‚   â”‚   â”‚   â”œâ”€â”€ decisions.py
â”‚   â”‚   â”‚   â”œâ”€â”€ discussion.py
â”‚   â”‚   â”‚   â”œâ”€â”€ knowledge.py
â”‚   â”‚   â”‚   â”œâ”€â”€ notifications.py
â”‚   â”‚   â”‚   â”œâ”€â”€ reports.py
â”‚   â”‚   â”‚   â”œâ”€â”€ uploads.py
â”‚   â”‚   â”‚   â”œâ”€â”€ users.py
â”‚   â”‚   â”‚   â””â”€â”€ version.py
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ auth.py
â”‚   â”‚   â”œâ”€â”€ config.py
â”‚   â”‚   â”œâ”€â”€ crud.py
â”‚   â”‚   â”œâ”€â”€ database.py
â”‚   â”‚   â”œâ”€â”€ dependencies.py
â”‚   â”‚   â”œâ”€â”€ email_service.py
â”‚   â”‚   â”œâ”€â”€ main.py
â”‚   â”‚   â”œâ”€â”€ models.py
â”‚   â”‚   â”œâ”€â”€ schemas.py
â”‚   â”‚   â”œâ”€â”€ security.py
â”‚   â”‚   â””â”€â”€ utils.py
â”‚   â”‚
â”‚   â”œâ”€â”€ requirements.txt
â”‚   â””â”€â”€ uploads/
â”‚
â”œâ”€â”€ database/
â”‚   â”œâ”€â”€ schema.sql
â”‚   â””â”€â”€ seed.sql
â”‚
â”œâ”€â”€ docker/
â”‚   â””â”€â”€ Dockerfile
â”‚
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ API_Documentation.pdf
â”‚   â”œâ”€â”€ ER_Diagram.pdf
â”‚   â””â”€â”€ Project_report.docx
â”‚
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ templates/
â”‚   â”‚   â”œâ”€â”€ ai_agent.html
â”‚   â”‚   â”œâ”€â”€ alternatives.html
â”‚   â”‚   â”œâ”€â”€ approvals.html
â”‚   â”‚   â”œâ”€â”€ audit_logs.html
â”‚   â”‚   â”œâ”€â”€ dashboard.html
â”‚   â”‚   â”œâ”€â”€ decision.html
â”‚   â”‚   â”œâ”€â”€ discussion.html
â”‚   â”‚   â”œâ”€â”€ knowledge.html
â”‚   â”‚   â”œâ”€â”€ login.html
â”‚   â”‚   â”œâ”€â”€ profile.html
â”‚   â”‚   â”œâ”€â”€ reports.html
â”‚   â”‚   â”œâ”€â”€ users.html
â”‚   â”‚   â””â”€â”€ ...
â”‚   â”‚
â”‚   â””â”€â”€ static/
â”‚       â”œâ”€â”€ css/
â”‚       â”œâ”€â”€ images/
â”‚       â””â”€â”€ js/
â”‚
â”œâ”€â”€ .env.example
â”œâ”€â”€ docker-compose.yml
â”œâ”€â”€ LICENSE
â””â”€â”€ README.md
```

---

# ðŸ› ï¸ 7. Technology Stack

### Backend

- **Python 3.11**
- **FastAPI**
- **Uvicorn**
- **SQLAlchemy**
- **Pydantic**
- **Alembic**
- **PostgreSQL**
- **python-jose**
- **Passlib / bcrypt**
- **python-dotenv**

### Frontend

- **HTML5**
- **CSS3**
- **JavaScript**
- **Jinja2 Templates**

### AI

- **Ollama-compatible local model server**
- AI model is configurable through `AI_MODEL`
- The supplied `.env.example` uses `qwen2.5:0.5b`

### Reporting

- **ReportLab** for PDF-related reporting
- **OpenPyXL** for Excel-related reporting

### Deployment

- **Docker**
- **Docker Compose**
- PostgreSQL container

---

# ðŸ–¥ï¸ 8. Application Screenshots

The screenshots below follow the **actual application flow and module order**. Each heading is matched with the correct screen instead of using unrelated screenshots.

## ðŸ” 8.1 Login

The Login screen is the entry point for authenticated users.

<p align="center">
  <img src="docs/screenshots/01-login.png" alt="EDRP Login" width="850">
</p>

---

## ðŸ“ 8.2 Register

The Register screen allows a new user to create an account in the platform.

<p align="center">
  <img src="docs/screenshots/02-register.png" alt="EDRP Registration" width="850">
</p>

---

## ðŸ”‘ 8.3 Forgot Password

The Forgot Password screen supports password recovery when a user cannot remember the login password.

<p align="center">
  <img src="docs/screenshots/03-forgot-password.png" alt="Forgot Password" width="950">
</p>

---

## ðŸ  8.4 Dashboard

The Dashboard provides a high-level view of the platform and its decision-management activities.

<p align="center">
  <img src="docs/screenshots/04-dashboard.png" alt="EDRP Dashboard" width="950">
</p>

---

## ðŸ“‹ 8.5 Decision Management

The Decision Management screen supports searching, filtering, viewing, and managing enterprise decisions.

<p align="center">
  <img src="docs/screenshots/05-decisions.png" alt="Decision Management" width="950">
</p>

---

## ðŸ”„ 8.6 Decision Version History

Decision Version History helps users review the changes and versions associated with a decision.

<p align="center">
  <img src="docs/screenshots/06-decision-version-history.png" alt="Decision Version History" width="950">
</p>

---

## âž• 8.7 Create New Decision

The Create Decision form is used to enter the information required for a new enterprise decision.

<p align="center">
  <img src="docs/screenshots/07-create-decision.png" alt="Create New Decision" width="850">
</p>

---

## âœ… 8.8 Approval Management

Approval Management displays approval records, approvers, statuses, escalation information, comments, dates, and available actions.

<p align="center">
  <img src="docs/screenshots/08-approvals.png" alt="Approval Management" width="950">
</p>

---

## ðŸ“ 8.9 Update Approval

The Update Approval form allows an approval status and reviewer comments to be updated.

<p align="center">
  <img src="docs/screenshots/09-approval-update.png" alt="Update Approval" width="850">
</p>

---

## ðŸ’¬ 8.10 Discussion Management

Discussion Management allows users to create and maintain comments associated with decisions.

<p align="center">
  <img src="docs/screenshots/10-discussion.png" alt="Discussion Management" width="900">
</p>

---

## ðŸ“š 8.11 Knowledge Repository

The Knowledge Repository stores organizational knowledge that can support future decisions and provide useful context for the AI Agent.

<p align="center">
  <img src="docs/screenshots/11-knowledge.png" alt="Knowledge Repository" width="950">
</p>

---

## âš–ï¸ 8.12 Alternative Analysis

Alternative Analysis supports structured comparison and evaluation of decision alternatives.

<p align="center">
  <img src="docs/screenshots/12-alternative-analysis.png" alt="Alternative Analysis" width="950">
</p>

---

## ðŸ¤– 8.13 AI Agent

The AI Agent provides an interface for decision-related questions using available EDRP context.

<p align="center">
  <img src="docs/screenshots/13-ai-agent.png" alt="AI Agent" width="900">
</p>

---

## ðŸ“Š 8.14 Reports & Analytics

The Reports module provides reporting and analytics information for enterprise decision management.

<p align="center">
  <img src="docs/screenshots/14-reports.png" alt="Reports and Analytics" width="950">
</p>

---

## ðŸ” 8.15 Audit Logs

Audit Logs provide visibility into system activity and help preserve traceability and accountability.

<p align="center">
  <img src="docs/screenshots/15-audit-logs.png" alt="Audit Logs" width="950">
</p>

---

## ðŸ‘¥ 8.16 User Management

User Management provides an administrative view of users and user-related actions.

<p align="center">
  <img src="docs/screenshots/16-user-management.png" alt="User Management" width="950">
</p>

---

## ðŸ‘¤ 8.17 My Profile

The Profile area provides user information and profile-related operations.

<p align="center">
  <img src="docs/screenshots/17-profile.png" alt="My Profile" width="900">
</p>

---

## ðŸ“§ 8.18 Email Notification

The platform sends email notifications for important workflow events. The example below shows an **Approval Escalated** notification generated when an approval becomes overdue.

<p align="center">
  <img src="docs/screenshots/18-email-notification.png" alt="Approval Escalated Email Notification" width="950">
</p>

> **Screenshot note:** Every screenshot above is mapped to its corresponding EDRP module and kept in the same order as the application workflow.

# ðŸ” 9. Authentication & Security

The backend includes authentication and security-related components such as:

- JWT-based authentication configuration
- Password hashing
- User login
- Password change
- Forgot-password workflow
- Reset-password workflow
- Role/user management
- Protected application operations

Configuration is supplied through environment variables rather than hard-coded application settings.

### Important

Never commit:

```text
.env
database passwords
SMTP passwords
JWT secret keys
API keys
```

The repository already contains `.env.example` for local configuration.

---

# ðŸ¤– 10. AI Agent Workflow

The AI Agent is designed around **database-grounded responses**.

```text
User Question
      â”‚
      â–¼
AI Agent Router
      â”‚
      â–¼
Identify relevant EDRP information
      â”‚
      â”œâ”€â”€ Decision
      â”œâ”€â”€ Alternatives
      â”œâ”€â”€ Approvals
      â”œâ”€â”€ Discussions
      â”œâ”€â”€ Knowledge
      â”œâ”€â”€ Versions
      â””â”€â”€ Audit Logs
      â”‚
      â–¼
Build Database Context
      â”‚
      â–¼
Ollama / Configured Local Model
      â”‚
      â–¼
Professional Response
```

The AI service explicitly instructs the model to use the EDRP database information supplied in the prompt and not invent unavailable database information.

---

# ðŸ“¡ 11. Backend API Areas

The FastAPI application exposes router groups for the major platform capabilities:

| API Prefix | Responsibility |
|---|---|
| `/users` | Authentication and user management |
| `/dashboard` | Dashboard data |
| `/decisions` | Decision CRUD operations |
| `/approvals` | Approval workflow |
| `/discussion` | Discussion records |
| `/knowledge` | Knowledge repository |
| `/reports` | Reporting and exports |
| `/alternatives` | Alternative analysis |
| `/versions` | Decision version history |
| `/audit` | Audit log access |
| `/notifications` | Notifications |
| `/attachments` | File attachments |
| `/ai-agent` | AI Agent interaction |

### Health Endpoint

```http
GET /health
```

Expected response:

```json
{
  "status": "healthy"
}
```

---

# âš™ï¸ 12. Environment Configuration

Create a local `.env` file from `.env.example`.

Example configuration:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/expert_decision_db

SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_FROM_NAME=Expert Decision Replay Platform

AI_ENABLED=true
AI_PROVIDER=ollama
AI_API_KEY=
AI_MODEL=qwen2.5:0.5b
OLLAMA_KEEP_ALIVE=10m
```

> Replace all placeholder values with your own local configuration. Do not publish credentials.

---

# ðŸš€ 13. Run the Project with Docker

## Step 1 â€” Clone the repository

```bash
git clone https://github.com/springboardmentor28126u/Expert-Decision-Replay-Platform-Group-2.git
cd Expert-Decision-Replay-Platform-Group-2
```

## Step 2 â€” Configure environment variables

Create `.env` from `.env.example` and update the database, authentication, email, and AI settings.

## Step 3 â€” Start the application

```bash
docker compose up -d --build
```

## Step 4 â€” Check running containers

```bash
docker compose ps
```

## Step 5 â€” Check the backend

Open:

```text
http://127.0.0.1:8000/health
```

Expected:

```json
{
  "status": "healthy"
}
```

## Step 6 â€” Open the application

```text
http://127.0.0.1:8000
```

---

# ðŸ 14. Run Backend Without Docker

From the project root:

```bash
cd backend
```

Create and activate a Python 3.11 virtual environment:

### Windows

```powershell
python -m venv venv
venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run FastAPI:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Then open:

```text
http://127.0.0.1:8000
```

---

# ðŸ—„ï¸ 15. Database

The project contains:

```text
database/
â”œâ”€â”€ schema.sql
â””â”€â”€ seed.sql
```

The application uses **PostgreSQL** and SQLAlchemy models.

The main domain models represented in the backend include:

- `User`
- `Decision`
- `Approval`
- `Discussion`
- `KnowledgeRepository`
- `AlternativeAnalysis`
- `AuditLog`
- `VersionTracking`
- `Notification`
- `Attachment`

---

# ðŸ§ª 16. Testing

The backend includes test modules such as:

```text
backend/app/test_db.py
backend/app/test_security.py
```

Run available tests with:

```bash
pytest
```

---

# ðŸ“š 17. Documentation

The project includes supporting documentation under `docs/`:

```text
docs/
â”œâ”€â”€ API_Documentation.pdf
â”œâ”€â”€ ER_Diagram.pdf
â””â”€â”€ Project_report.docx
```

These documents can be used together with this README for technical review and project presentation.

---

# ðŸ“ˆ 18. Why EDRP is Useful

### Before EDRP

```text
Emails
   +
Spreadsheets
   +
Documents
   +
Chat Discussions
   +
Unstructured Approvals
   +
Scattered History
        â†“
Difficult to replay decisions
```

### With EDRP

```text
                 â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                 â”‚   Decisions   â”‚
                 â””â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
                         â”‚
       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
       â–¼                 â–¼                 â–¼
 Approvals          Alternatives       Discussions
       â”‚                 â”‚                 â”‚
       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                         â–¼
                â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                â”‚ Version History â”‚
                â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                         â–¼
                â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                â”‚  Audit + Logs   â”‚
                â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                         â–¼
                â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                â”‚ Reports + AI    â”‚
                â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

# ðŸ’¡ 19. Key Strengths

| Strength | Benefit |
|---|---|
| **Centralized Decisions** | Important decisions remain in one workspace. |
| **Version Tracking** | Changes can be reviewed over time. |
| **Approval Workflow** | Decisions can move through a structured approval process. |
| **Alternative Analysis** | Options can be evaluated before final decisions. |
| **Discussion History** | Decision-related conversations are preserved. |
| **Knowledge Repository** | Organizational information can be reused. |
| **Auditability** | System activity can be reviewed. |
| **Reporting** | Decision and approval information can be presented in reports. |
| **AI Assistance** | Users can query decision-related application data through the AI Agent. |
| **Enterprise UI** | Modules are organized into a consistent administrative workspace. |

---

# ðŸ—ºï¸ 20. Future Enhancement Areas

Possible future improvements include:

- Advanced decision scoring and recommendation models
- More sophisticated alternative ranking
- Richer approval escalation rules
- Advanced search across decisions and knowledge
- Additional analytics and visualizations
- Expanded AI capabilities
- More granular role and permission policies
- Automated notifications and reminders
- Improved replay/timeline visualization
- Additional integrations with enterprise systems

---

# ðŸ‘¨â€ðŸ’» 21. Development Notes

### Backend entry point

```text
backend/app/main.py
```

### AI components

```text
backend/app/ai/
â”œâ”€â”€ agent.py
â”œâ”€â”€ prompts.py
â”œâ”€â”€ service.py
â””â”€â”€ tools.py
```

### API routers

```text
backend/app/routers/
```

### Frontend templates

```text
frontend/templates/
```

### Frontend JavaScript

```text
frontend/static/js/
```

### Frontend CSS

```text
frontend/static/css/
```

---

# ðŸ† 22. Project Summary

**Expert Decision Replay Platform (EDRP)** brings together the major activities involved in enterprise decision management:

> **Create â†’ Analyze â†’ Discuss â†’ Approve â†’ Track â†’ Audit â†’ Report â†’ Learn â†’ Replay**

The platform combines a **FastAPI backend**, **PostgreSQL database**, **Jinja2/HTML/CSS/JavaScript frontend**, structured decision-management modules, reporting, auditability, and an **Ollama-compatible AI Agent** into one centralized enterprise workspace.

---

## â­ Final Project View

<p align="center">
  <img src="docs/screenshots/04-dashboard.png" alt="EDRP Final Dashboard" width="1000">
</p>

<p align="center">
  <strong>Expert Decision Replay Platform â€” Making Enterprise Decisions Traceable, Collaborative, and Replayable.</strong>
</p>

---

## ðŸ“„ License

See the repository `LICENSE` file for project licensing information.

---

<p align="center">
  Made for the <strong>Expert Decision Replay Platform</strong> project.
</p>
