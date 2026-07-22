# Slide Deck Presentation: Expert Decision Replay Platform

---

## Slide 1: Title & Platform Overview
### Expert Decision Replay Platform
*An Academic Virtual Internship Project (Infosys Springboard)*

*   **Presented By**: Platform Engineering Team
*   **Goal**: Develop a centralized corporate memory ledger to log, compare, discuss, approve, and audit organizational decisions.
*   **Purpose**: Enable organizations to preserve institutional knowledge, allowing employees to replay previous trade-offs and avoid repeating past mistakes.

---

## Slide 2: The Problem Statement
### The Challenge of Organizational Memory Loss
*   **Loss of Rationale**: Critical technical/strategic decisions are often made during ad-hoc meetings, and their core trade-offs and rationale are forgotten.
*   **Repetition of Mistakes**: New team members lack access to historical decision timelines, leading them to duplicate failed approaches.
*   **Lack of Standardization**: Alternative comparisons (cost-estimate, risks, feasibility analysis) are not audited uniformly.
*   **Siloed Discussions**: Design conversations occur in email threads or chat clients instead of being linked directly to the decisions they describe.

---

## Slide 3: Core Project Objectives
### Platform Outcomes
*   **Centralized Repository**: A structured platform mapping categories (Technology, Finance, HR, Operations, Marketing).
*   **Role-Based Auditing**: Strict access levels for Employee, Reviewer, Manager, and Admin.
*   **Workflow Transparency**: Multi-stage review checklists verifying options.
*   **Collaborative Context**: Threaded comments, attachment uploads, and decision rationale.
*   **Compliance Verification**: Detailed operations audit trail capturing security events, modifications, and exports.
*   **Data Portability**: Dynamic reports generation as corporate PDFs and Excel logs.

---

## Slide 4: System Architecture
### High-Level Components
*   **Frontend Client**: Flask web application forwarding actions and session cookies.
*   **REST API Gateway**: FastAPI backend enforcing schemas and role-based permissions.
*   **Relational Storage**: PostgreSQL database containing all models mapping.
*   **Cache & Session Stores**: Redis cache backend.
*   **Deployment**: Containerized Docker and Docker Compose orchestration.

---

## Slide 5: Database Schema Design
### Models Relationships Overview
*   **Users & Teams**: Mapped with nullable foreign keys to prevent circular imports (resolved using Alembic post-update schema changes).
*   **Decision Versioning**: Logging changes in `DecisionVersion` when edits occur on drafts.
*   **Approvals Workflow**: Multi-stage reviewer actions referencing user roles.
*   **Discussions**: Threaded parent-child structure supporting meeting notes and rationale flags.
*   **Audit Trail**: Logs user id, action name, old values, new values, and source IP address.

---

## Slide 6: The Approvals & Decision Flow
```text
  [Draft State] 
        │ 
        ▼  Assign Reviewer (Stage 1)
  [Under Review] 
        │ 
        ├──────────── Approve Verdict (Stage 1 / 2) ───────────┐
        │                                                      │
        ▼  Reject Verdict                                     ▼  Final Approval
  [Rejected State]                                      [Approved State]
```
*   **Assign**: Creators designate reviewers, updating status to `under_review`.
*   **Inspect**: Reviewers submit comments and verdict (Approve / Reject).
*   **Notify**: Creator receives immediate notifications describing comments.

---

## Slide 7: Technical Stack & Libraries
*   **Web Frameworks**: FastAPI (0.139+), Flask (3.0+)
*   **ORM & Migrations**: SQLAlchemy (2.0+), Alembic (1.18+)
*   **Security & Hashing**: jose (cryptography), bcrypt, passlib
*   **Reports Exporters**: ReportLab (PDF), openpyxl (Excel)
*   **Infrastructure**: Docker Engine, Docker Compose, PostgreSQL 15, Redis 7

---

## Slide 8: Docker Containerization
### Orchestrated Services Stack
*   **Database Service**: PostgreSQL image with health checks.
*   **Cache Service**: Redis instance.
*   **Backend REST Gateway**: FastAPI uvicorn daemon.
*   **Frontend Server**: Flask application mapped on port `5001`.

```bash
# Run the complete stack in a clean environment
docker compose up --build -d

# Verify operational health status
docker compose ps
```

---

## Slide 9: Project Results & Verification
*   **Unit Tests**: Passed Milestones 1, 2, and 3 verification tests.
*   **Live Audit Checks**: Tested token generation, categories, and role restrictions on docker containers.
*   **Database Seeding**: Default categories seed automatically upon database initialization.

---

## Slide 10: Future Scope & Conclusion
### Roadmap & Final Takeaway
*   **Future Scope**:
    *   Integrate LDAP/Active Directory or OAuth2 providers (Google/Microsoft).
    *   Add file storage connections for AWS S3.
    *   Incorporate team analytics charts.
*   **Conclusion**:
    *   The Expert Decision Replay Platform succeeds in preserving corporate memory.
    *   All modules are verified as stable, type-safe, error-free, and production-ready.
