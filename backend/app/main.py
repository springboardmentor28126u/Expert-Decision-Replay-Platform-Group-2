from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.database import Base, engine
import app.models

from app.routers import (
    users,
    dashboard,
    decisions,
    approvals,
    discussion,
    knowledge,
    reports,
    alternative,
    audit,
    version,
    notifications,
    uploads,
    ai_agent

  

)

# ==========================================
# Create Database Tables
# ==========================================

Base.metadata.create_all(bind=engine)

# ==========================================
# FastAPI App
# ==========================================

app = FastAPI(
    title="Expert Decision Replay Platform",
    version="1.0",
    description="Enterprise Decision Management System"
)

# ==========================================
# Static Files
# ==========================================

app.mount(
    "/static",
    StaticFiles(directory="../frontend/static"),
    name="static"
)

# ==========================================
# Templates
# ==========================================

templates = Jinja2Templates(
    directory="../frontend/templates"
)

# ==========================================
# API Routers
# ==========================================

app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(decisions.router)
app.include_router(approvals.router)
app.include_router(discussion.router)
app.include_router(knowledge.router)
app.include_router(reports.router)
app.include_router(alternative.router)
app.include_router(version.router)
app.include_router(audit.router)
app.include_router(notifications.router)
app.include_router(uploads.router)
app.include_router(ai_agent.router)
# ==========================================
# Home API
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Expert Decision Replay Platform API is Running!"
    }
@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
# ==========================================
# Frontend Pages
# ==========================================

@app.get("/login")
def login_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={}
    )


@app.get("/register")
def register_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="register.html",
        context={}
    )


@app.get("/dashboard-page")
def dashboard_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={}
    )


@app.get("/decision-page")
def decision_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="decision.html",
        context={}
    )


@app.get("/approvals-page")
def approvals_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="approvals.html",
        context={}
    )


@app.get("/discussion-page")
def discussion_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="discussion.html",
        context={}
    )


@app.get("/knowledge-page")
def knowledge_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="knowledge.html",
        context={}
    )


@app.get("/reports-page")
def reports_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="reports.html",
        context={}
    )
@app.get("/users-page")
def users_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="users.html",
        context={}
    )
@app.get("/profile-page")
def profile_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="profile.html",
        context={}
    )

@app.get("/change-password-page")
def change_password_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="change_password.html",
        context={}
    )
@app.get("/forgot-password")
def forgot_password_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="forgot_password.html",
        context={}
    )
@app.get("/reset-password")
def reset_password_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="reset_password.html",
        context={}
    )
@app.get("/alternatives-page")
def alternatives_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="alternatives.html",
        context={}
    )
@app.get("/audit-logs")
def audit_logs_page(request: Request):

    return templates.TemplateResponse(

        request=request,

        name="audit_logs.html",

        context={}

    )
# ==========================================
# AI AGENT PAGE
# ==========================================

@app.get("/ai-agent-page")
def ai_agent_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="ai_agent.html",
        context={}
    )