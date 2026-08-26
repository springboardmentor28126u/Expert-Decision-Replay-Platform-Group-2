# 🧠 Expert Decision Replay Platform (EDRP)

<p align="center">
  <strong>A centralized enterprise platform for capturing, managing, reviewing, approving, discussing, analyzing, and replaying business decisions.</strong>
</p>

<p align="center">
  <strong>Expert Decision Replay Platform</strong><br>
  Enterprise Decision Management • Approval Workflow • Knowledge • Analytics • Auditability • AI Assistance
</p>

\---

## 📌 Project Information

|Item|Details|
|-|-|
|**Project Name**|Expert Decision Replay Platform|
|**Short Name**|EDRP|
|**Repository**|`Expert-Decision-Replay-Platform-Group-2`|
|**Project Type**|Enterprise Decision Management Web Application|
|**Backend**|Python + FastAPI|
|**Database**|PostgreSQL|
|**Frontend**|HTML + CSS + JavaScript + Jinja2|
|**AI Integration**|Ollama-compatible local LLM|
|**Deployment**|Docker / Docker Compose|
|**API Server**|Uvicorn|
|**API Version**|FastAPI application v1.0|

> \*\*Note:\*\* This README is based on the project structure and implementation files in the supplied EDRP project, together with the application screens shared during development.

\---



# 🌟 1. What is EDRP?

The **Expert Decision Replay Platform (EDRP)** is an enterprise-oriented web application designed to make organizational decision-making **structured, traceable, collaborative, and reviewable**.

Instead of keeping important decisions scattered across emails, documents, spreadsheets, and conversations, EDRP brings the decision lifecycle into one workspace.

### The platform helps an organization:

* 📝 Create and manage business decisions
* 🔄 Track decision versions and changes
* ⚖️ Evaluate and compare alternatives
* ✅ Manage approval workflows
* 💬 Conduct decision-related discussions
* 📚 Maintain reusable organizational knowledge
* 📊 Generate reports and analytics
* 🔍 Maintain audit logs
* 🔔 Manage notifications
* 📎 Store decision attachments
* 🤖 Ask an AI Agent questions using available EDRP data
* 👥 Manage users and profiles

\---

# 🎯 2. Project Objectives

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

\---

# 🧩 3. Main Modules

|#|Module|Purpose|
|-|-|-|
|01|🔐 **Authentication**|Login, registration, forgot-password and password recovery workflows.|
|02|🏠 **Dashboard**|Provides a centralized overview of decisions, approvals, discussions, users, trends, and summaries.|
|03|📋 **Decision Management**|Create, view, edit, filter, delete, and track enterprise decisions.|
|04|🔄 **Decision Version History**|Records decision changes so previous versions and decision evolution can be reviewed.|
|05|➕ **Create Decision**|Provides the form used to capture a new enterprise decision and its required details.|
|06|✅ **Approval Management**|Tracks approvers, approval status, comments, escalation information, and approval/rejection actions.|
|07|💬 **Discussion Management**|Allows users to create and manage decision-related discussions and comments.|
|08|📚 **Knowledge Repository**|Stores reusable organizational knowledge and supporting information for future decisions.|
|09|⚖️ **Alternative Analysis**|Supports structured comparison and evaluation of alternative options.|
|10|🤖 **AI Agent**|Provides decision-related AI assistance using available EDRP context.|
|11|📊 **Reports \& Analytics**|Provides reporting, summaries, analytics, and export-related functionality.|
|12|🔍 **Audit Logs**|Records important system activity for traceability and accountability.|
|13|👥 **User Management**|Supports administrative user management and role-related operations.|
|14|👤 **My Profile**|Provides user profile information and profile-related operations.|
|15|📧 **Email Notifications**|Sends email notifications for important workflow events such as escalated or overdue approvals.|
|16|📎 **Attachments**|Handles files associated with application records.|

# 🔄 4. Decision Lifecycle

```text
                     ┌───────────────────┐
                     │  Create Decision  │
                     └─────────┬─────────┘
                               │
                               ▼
                     ┌───────────────────┐
                     │  Draft Decision   │
                     └─────────┬─────────┘
                               │
                               ▼
                 ┌────────────────────────────┐
                 │ Alternative Analysis       │
                 │ Compare available options  │
                 └─────────────┬──────────────┘
                               │
                               ▼
                     ┌───────────────────┐
                     │ Approval Workflow│
                     └─────────┬─────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
        ┌─────────────────┐          ┌─────────────────┐
        │     Approved    │          │     Rejected    │
        └────────┬────────┘          └────────┬────────┘
                 │                            │
                 └──────────────┬─────────────┘
                                ▼
                     ┌────────────────────┐
                     │ Version / Audit    │
                     │ History \& Replay   │
                     └─────────┬──────────┘
                               │
                               ▼
                     ┌────────────────────┐
                     │ Reports / Knowledge│
                     │ / AI Assistance    │
                     └────────────────────┘
```

\---

# ⚙️ Project Setup

### 1\. Clone the repository

```bash
git clone <repository-url>
cd Expert-Decision-Replay-Platform-Group-2
```

### 2\. Open the backend

```powershell
cd backend
```

### 3\. Create and activate the Python virtual environment

If the virtual environment does not already exist:

```powershell
python -m venv venv
```

Activate it on Windows PowerShell:

```powershell
./venv/Scripts/activate
```

### 4\. Install the backend dependencies

```powershell
pip install -r requirements.txt
```

### 5\. Start the FastAPI backend

```powershell
uvicorn app.main:app --reload
```

The backend will run locally at the address displayed by Uvicorn, typically `http://127.0.0.1:8000`.

# 🏗️ 5. System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    EDRP Web Interface                       │
│                                                             │
│ HTML Templates │ CSS │ JavaScript │ Jinja2                 │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP / JSON
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                         │
│                                                             │
│ Users │ Decisions │ Approvals │ Discussions │ Knowledge    │
│ Reports │ Alternatives │ Versions │ Audit │ Notifications │
│ Attachments │ AI Agent                                      │
└───────────────┬──────────────────────────────┬──────────────┘
                │                              │
                ▼                              ▼
┌──────────────────────────┐       ┌──────────────────────────┐
│       PostgreSQL         │       │       Ollama / LLM       │
│                          │       │                          │
│ Decisions               │       │ AI Agent                 │
│ Approvals               │       │ Decision context         │
│ Discussions             │       │ Alternatives             │
│ Knowledge               │       │ Approvals                │
│ Users / Audit / etc.    │       │ Versions / Audit         │
└──────────────────────────┘       └──────────────────────────┘
```

\---

# 📁 6. Project Structure

The following structure reflects the supplied project:

```text
Expert-Decision-Replay-Platform-Group-2/
│
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── \_\_init\_\_.py
│   │   │   ├── agent.py
│   │   │   ├── prompts.py
│   │   │   ├── service.py
│   │   │   └── tools.py
│   │   │
│   │   ├── routers/
│   │   │   ├── ai\_agent.py
│   │   │   ├── alternative.py
│   │   │   ├── approvals.py
│   │   │   ├── audit.py
│   │   │   ├── dashboard.py
│   │   │   ├── decisions.py
│   │   │   ├── discussion.py
│   │   │   ├── knowledge.py
│   │   │   ├── notifications.py
│   │   │   ├── reports.py
│   │   │   ├── uploads.py
│   │   │   ├── users.py
│   │   │   └── version.py
│   │   │
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── crud.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── email\_service.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── security.py
│   │   └── utils.py
│   │
│   ├── requirements.txt
│   └── uploads/
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── docker/
│   └── Dockerfile
│
├── docs/
│   ├── API\_Documentation.pdf
│   ├── ER\_Diagram.pdf
│   └── Project\_report.docx
│
├── frontend/
│   ├── templates/
│   │   ├── ai\_agent.html
│   │   ├── alternatives.html
│   │   ├── approvals.html
│   │   ├── audit\_logs.html
│   │   ├── dashboard.html
│   │   ├── decision.html
│   │   ├── discussion.html
│   │   ├── knowledge.html
│   │   ├── login.html
│   │   ├── profile.html
│   │   ├── reports.html
│   │   ├── users.html
│   │   └── ...
│   │
│   └── static/
│       ├── css/
│       ├── images/
│       └── js/
│
├── .env.example
├── docker-compose.yml
├── LICENSE
└── README.md
```

\---

# 🛠️ 7. Technology Stack

### Backend

* **Python 3.11**
* **FastAPI**
* **Uvicorn**
* **SQLAlchemy**
* **Pydantic**
* **Alembic**
* **PostgreSQL**
* **python-jose**
* **Passlib / bcrypt**
* **python-dotenv**

### Frontend

* **HTML5**
* **CSS3**
* **JavaScript**
* **Jinja2 Templates**

### AI

* **Ollama-compatible local model server**
* AI model is configurable through `AI\_MODEL`
* The supplied `.env.example` uses `qwen2.5:0.5b`

### Reporting

* **ReportLab** for PDF-related reporting
* **OpenPyXL** for Excel-related reporting

### Deployment

* **Docker**
* **Docker Compose**
* PostgreSQL container

\---

# 🖥️ 8. Application Screenshots

The screenshots below follow the **actual application flow and module order**. Each heading is matched with the correct screen instead of using unrelated screenshots.

## 🔐 8.1 Login

The Login screen is the entry point for authenticated users.

<p align="center">
  <img src="docs/screenshots/01-login.png" alt="EDRP Login" width="850">
</p>

\---

## 📝 8.2 Register

The Register screen allows a new user to create an account in the platform.

<p align="center">
  <img src="docs/screenshots/02-register.png" alt="EDRP Registration" width="850">
</p>

\---

## 🔑 8.3 Forgot Password

The Forgot Password screen supports password recovery when a user cannot remember the login password.

<p align="center">
  <img src="docs/screenshots/03-forgot-password.png" alt="Forgot Password" width="950">
</p>

\---

## 🏠 8.4 Dashboard

The Dashboard provides a high-level view of the platform and its decision-management activities.

<p align="center">
  <img src="docs/screenshots/04-dashboard.png" alt="EDRP Dashboard" width="950">
</p>

\---

## 📋 8.5 Decision Management

The Decision Management screen supports searching, filtering, viewing, and managing enterprise decisions.

<p align="center">
  <img src="docs/screenshots/05-decisions.png" alt="Decision Management" width="950">
</p>

\---

## 🔄 8.6 Decision Version History

Decision Version History helps users review the changes and versions associated with a decision.

<p align="center">
  <img src="docs/screenshots/06-decision-version-history.png" alt="Decision Version History" width="950">
</p>

\---

## ➕ 8.7 Create New Decision

The Create Decision form is used to enter the information required for a new enterprise decision.

<p align="center">
  <img src="docs/screenshots/07-create-decision.png" alt="Create New Decision" width="850">
</p>

\---

## ✅ 8.8 Approval Management

Approval Management displays approval records, approvers, statuses, escalation information, comments, dates, and available actions.

<p align="center">
  <img src="docs/screenshots/08-approvals.png" alt="Approval Management" width="950">
</p>

\---

## 📝 8.9 Update Approval

The Update Approval form allows an approval status and reviewer comments to be updated.

<p align="center">
  <img src="docs/screenshots/09-approval-update.png" alt="Update Approval" width="850">
</p>

\---

## 💬 8.10 Discussion Management

Discussion Management allows users to create and maintain comments associated with decisions.

<p align="center">
  <img src="docs/screenshots/10-discussion.png" alt="Discussion Management" width="900">
</p>

\---

## 📚 8.11 Knowledge Repository

The Knowledge Repository stores organizational knowledge that can support future decisions and provide useful context for the AI Agent.

<p align="center">
  <img src="docs/screenshots/11-knowledge.png" alt="Knowledge Repository" width="950">
</p>

\---

## ⚖️ 8.12 Alternative Analysis

Alternative Analysis supports structured comparison and evaluation of decision alternatives.

<p align="center">
  <img src="docs/screenshots/12-alternative-analysis.png" alt="Alternative Analysis" width="950">
</p>

\---

## 🤖 8.13 AI Agent

The AI Agent provides an interface for decision-related questions using available EDRP context.

<p align="center">
  <img src="docs/screenshots/13-ai-agent.png" alt="AI Agent" width="900">
</p>

\---

## 📊 8.14 Reports \& Analytics

The Reports module provides reporting and analytics information for enterprise decision management.

<p align="center">
  <img src="docs/screenshots/14-reports.png" alt="Reports and Analytics" width="950">
</p>

\---

## 🔍 8.15 Audit Logs

Audit Logs provide visibility into system activity and help preserve traceability and accountability.

<p align="center">
  <img src="docs/screenshots/15-audit-logs.png" alt="Audit Logs" width="950">
</p>

\---

## 👥 8.16 User Management

User Management provides an administrative view of users and user-related actions.

<p align="center">
  <img src="docs/screenshots/16-user-management.png" alt="User Management" width="950">
</p>

\---

## 👤 8.17 My Profile

The Profile area provides user information and profile-related operations.

<p align="center">
  <img src="docs/screenshots/17-profile.png" alt="My Profile" width="900">
</p>

\---

## 📧 8.18 Email Notification

The platform sends email notifications for important workflow events. The example below shows an **Approval Escalated** notification generated when an approval becomes overdue.

<p align="center">
  <img src="docs/screenshots/18-email-notification.png" alt="Approval Escalated Email Notification" width="950">
</p>

> \*\*Screenshot note:\*\* Every screenshot above is mapped to its corresponding EDRP module and kept in the same order as the application workflow.

# 🔐 9. Authentication \& Security

The backend includes authentication and security-related components such as:

* JWT-based authentication configuration
* Password hashing
* User login
* Password change
* Forgot-password workflow
* Reset-password workflow
* Role/user management
* Protected application operations

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

\---

# 🤖 10. AI Agent Workflow

The AI Agent is designed around **database-grounded responses**.

```text
User Question
      │
      ▼
AI Agent Router
      │
      ▼
Identify relevant EDRP information
      │
      ├── Decision
      ├── Alternatives
      ├── Approvals
      ├── Discussions
      ├── Knowledge
      ├── Versions
      └── Audit Logs
      │
      ▼
Build Database Context
      │
      ▼
Ollama / Configured Local Model
      │
      ▼
Professional Response
```

The AI service explicitly instructs the model to use the EDRP database information supplied in the prompt and not invent unavailable database information.

\---

# 📡 11. Backend API Areas

The FastAPI application exposes router groups for the major platform capabilities:

|API Prefix|Responsibility|
|-|-|
|`/users`|Authentication and user management|
|`/dashboard`|Dashboard data|
|`/decisions`|Decision CRUD operations|
|`/approvals`|Approval workflow|
|`/discussion`|Discussion records|
|`/knowledge`|Knowledge repository|
|`/reports`|Reporting and exports|
|`/alternatives`|Alternative analysis|
|`/versions`|Decision version history|
|`/audit`|Audit log access|
|`/notifications`|Notifications|
|`/attachments`|File attachments|
|`/ai-agent`|AI Agent interaction|

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

\---

# ⚙️ 12. Environment Configuration

Create a local `.env` file from `.env.example`.

Example configuration:

```env
DATABASE\_URL=postgresql://postgres:YOUR\_PASSWORD@localhost:5432/expert\_decision\_db

SECRET\_KEY=your\_secret\_key\_here
ALGORITHM=HS256
ACCESS\_TOKEN\_EXPIRE\_MINUTES=30

EMAIL\_ENABLED=true
SMTP\_HOST=smtp.gmail.com
SMTP\_PORT=587
SMTP\_USERNAME=your\_email@gmail.com
SMTP\_PASSWORD=your\_gmail\_app\_password
SMTP\_FROM\_EMAIL=your\_email@gmail.com
SMTP\_FROM\_NAME=Expert Decision Replay Platform

AI\_ENABLED=true
AI\_PROVIDER=ollama
AI\_API\_KEY=
AI\_MODEL=qwen2.5:0.5b
OLLAMA\_KEEP\_ALIVE=10m
```

> Replace all placeholder values with your own local configuration. Do not publish credentials.

\---

# 🚀 13. Run the Project with Docker

## Step 1 — Clone the repository

```bash
git clone https://github.com/springboardmentor28126u/Expert-Decision-Replay-Platform-Group-2.git
cd Expert-Decision-Replay-Platform-Group-2
```

## Step 2 — Configure environment variables

Create `.env` from `.env.example` and update the database, authentication, email, and AI settings.

## Step 3 — Start the application

```bash
docker compose up -d --build
```

## Step 4 — Check running containers

```bash
docker compose ps
```

## Step 5 — Check the backend

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

## Step 6 — Open the application

```text
http://127.0.0.1:8000
```

\---

# 🐍 14. Run Backend Without Docker

From the project root:

```bash
cd backend
```

Create and activate a Python 3.11 virtual environment:

### Windows

```powershell
python -m venv venv
venv\\Scripts\\activate
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

\---

# 🗄️ 15. Database

The project contains:

```text
database/
├── schema.sql
└── seed.sql
```

The application uses **PostgreSQL** and SQLAlchemy models.

The main domain models represented in the backend include:

* `User`
* `Decision`
* `Approval`
* `Discussion`
* `KnowledgeRepository`
* `AlternativeAnalysis`
* `AuditLog`
* `VersionTracking`
* `Notification`
* `Attachment`

\---

# 🧪 16. Testing

The backend includes test modules such as:

```text
backend/app/test\_db.py
backend/app/test\_security.py
```

Run available tests with:

```bash
pytest
```

\---

# 📚 17. Documentation

The project includes supporting documentation under `docs/`:

```text
docs/
├── API\_Documentation.pdf
├── ER\_Diagram.pdf
└── Project\_report.docx
```

These documents can be used together with this README for technical review and project presentation.

\---

# 📈 18. Why EDRP is Useful

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
        ↓
Difficult to replay decisions
```

### With EDRP

```text
                 ┌───────────────┐
                 │   Decisions   │
                 └───────┬───────┘
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
 Approvals          Alternatives       Discussions
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ▼
                ┌─────────────────┐
                │ Version History │
                └────────┬────────┘
                         ▼
                ┌─────────────────┐
                │  Audit + Logs   │
                └────────┬────────┘
                         ▼
                ┌─────────────────┐
                │ Reports + AI    │
                └─────────────────┘
```

\---

# 💡 19. Key Strengths

|Strength|Benefit|
|-|-|
|**Centralized Decisions**|Important decisions remain in one workspace.|
|**Version Tracking**|Changes can be reviewed over time.|
|**Approval Workflow**|Decisions can move through a structured approval process.|
|**Alternative Analysis**|Options can be evaluated before final decisions.|
|**Discussion History**|Decision-related conversations are preserved.|
|**Knowledge Repository**|Organizational information can be reused.|
|**Auditability**|System activity can be reviewed.|
|**Reporting**|Decision and approval information can be presented in reports.|
|**AI Assistance**|Users can query decision-related application data through the AI Agent.|
|**Enterprise UI**|Modules are organized into a consistent administrative workspace.|

\---

# 🗺️ 20. Future Enhancement Areas

Possible future improvements include:

* Advanced decision scoring and recommendation models
* More sophisticated alternative ranking
* Richer approval escalation rules
* Advanced search across decisions and knowledge
* Additional analytics and visualizations
* Expanded AI capabilities
* More granular role and permission policies
* Automated notifications and reminders
* Improved replay/timeline visualization
* Additional integrations with enterprise systems

\---

# 👨‍💻 21. Development Notes

### Backend entry point

```text
backend/app/main.py
```

### AI components

```text
backend/app/ai/
├── agent.py
├── prompts.py
├── service.py
└── tools.py
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

\---

# 🏆 22. Project Summary

**Expert Decision Replay Platform (EDRP)** brings together the major activities involved in enterprise decision management:

> \*\*Create → Analyze → Discuss → Approve → Track → Audit → Report → Learn → Replay\*\*

The platform combines a **FastAPI backend**, **PostgreSQL database**, **Jinja2/HTML/CSS/JavaScript frontend**, structured decision-management modules, reporting, auditability, and an **Ollama-compatible AI Agent** into one centralized enterprise workspace.

\---

## 📄 License

See the repository `LICENSE` file for project licensing information.

\---

<p align="center">
  Made for the <strong>Expert Decision Replay Platform</strong> project.
</p>