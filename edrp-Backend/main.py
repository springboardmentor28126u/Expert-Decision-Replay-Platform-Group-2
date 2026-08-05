from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import audit
from routers import notifications
from routers import ratings

from routers import (
    auth_routes,
    users,
    teams,
    decisions,
    alternatives,
    attachments,
    comments,
    approvals,
    admin,
)

app = FastAPI(
    title="Expert Decision Replay Platform (EDRP)",
    summary="Enterprise decision governance and collaboration platform for structured review workflows.",
    description=(
        "EDRP is a decision replay and governance platform that helps organizations capture "
        "the problem statement, explore alternatives, preserve decision history, coordinate review "
        "and approval workflows, and surface operational learning through audit and notification APIs."
    ),
    version="1.0.0",
    contact={
        "name": "EDRP Support",
        "email": "support@edrp.example.com",
        "url": "https://example.com/edrp",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    openapi_tags=[
        {"name": "Authentication", "description": "Register, authenticate, and obtain access tokens for secure API use."},
        {"name": "Users", "description": "User profile, role assignment, and team membership management APIs."},
        {"name": "Teams", "description": "Team lifecycle management, team membership, and team detail retrieval APIs."},
        {"name": "Decisions", "description": "Create, search, update, export, and review organizational decisions."},
        {"name": "Alternatives", "description": "Manage alternative options associated with a decision."},
        {"name": "Attachments", "description": "Upload, download, and delete decision attachments."},
        {"name": "Comments", "description": "Add and retrieve threaded comments tied to decisions."},
        {"name": "Approvals", "description": "Review and approve or reject decisions through a structured workflow."},
        {"name": "Ratings", "description": "Collect and summarize end-user rating feedback for decisions."},
        {"name": "Notifications", "description": "Fetch and manage in-app notification state for users."},
        {"name": "Audit Logs", "description": "Retrieve historical administrative activity logs and traceability data."},
        {"name": "Administration", "description": "Administrative dashboards and system-wide analytics endpoints."},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "EDRP backend is running!"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(auth_routes.router)
app.include_router(users.router)
app.include_router(teams.router)
app.include_router(decisions.router)
app.include_router(alternatives.router)
app.include_router(attachments.router)
app.include_router(comments.router)
app.include_router(comments.router1)
app.include_router(approvals.router)
app.include_router(admin.router)
app.include_router(audit.router)
app.include_router(notifications.router)
app.include_router(ratings.router)
