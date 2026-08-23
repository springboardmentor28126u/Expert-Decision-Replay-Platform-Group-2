from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.database import Base, engine
from app.models.user import User
from app.models.decision import Decision
from app.api.auth import router as auth_router
from app.core.dependencies import get_current_user
from app.models.user import User
from fastapi import Depends
from app.api.decision import router as decision_router
from app.models.decision_history import DecisionHistory
from app.models.decision_document import DecisionDocument
from app.models.alternative import Alternative
from app.api.alternative import router as alternative_router
from app.models.comment import Comment
from app.api.comment import router as comment_router
from app.api.history import router as history_router
from app.models.approval import Approval
from app.api.approval import router as approval_router
from app.models.comment import Comment
from app.models.notification import Notification
from app.api.notification import router as notification_router
from app.api.user import router as user_router
from app.models.audit_log import AuditLog
from app.api.audit import router as audit_router
from app.api.report import router as report_router

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://expert-decision-replay-platform-group-2-1.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(decision_router)
app.include_router(alternative_router)
app.include_router(comment_router)
app.include_router(history_router)
app.include_router(approval_router)
app.include_router(notification_router)
app.include_router(audit_router)
app.include_router(report_router)
app.include_router(user_router)

@app.get("/")
def root():
    return {
        "message": "Expert Decision Replay Platform API is running successfully!"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/me")
def read_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role
    }

@app.get("/create-tables")
def create_tables():
    Base.metadata.create_all(bind=engine)
    return {"message": "Tables created successfully"}