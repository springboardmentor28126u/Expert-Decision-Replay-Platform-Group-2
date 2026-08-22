from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import (
    User,
    Decision,
    Approval,
    Discussion,
    KnowledgeRepository
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    total_users = db.query(User).count()

    total_decisions = db.query(Decision).count()

    draft_decisions = db.query(Decision).filter(
        Decision.status == "Draft"
    ).count()

    pending_decisions = db.query(Decision).filter(
        Decision.status == "Pending"
    ).count()

    approved_decisions = db.query(Decision).filter(
        Decision.status == "Approved"
    ).count()

    rejected_decisions = db.query(Decision).filter(
        Decision.status == "Rejected"
    ).count()

    total_discussions = db.query(Discussion).count()

    total_knowledge_articles = db.query(
        KnowledgeRepository
    ).count()

    pending_approvals = db.query(Approval).filter(
        Approval.status == "Pending"
    ).count()

    approved_approvals = db.query(Approval).filter(
        Approval.status == "Approved"
    ).count()

    rejected_approvals = db.query(Approval).filter(
        Approval.status == "Rejected"
    ).count()

    recent = (
        db.query(Decision)
        .order_by(Decision.created_at.desc())
        .limit(5)
        .all()
    )

    recent_activities = []

    for decision in recent:

        owner = db.query(User).filter(
            User.id == decision.created_by
        ).first()

        recent_activities.append({

            "user":
                owner.full_name if owner else "Unknown",

            "action":
                "Created Decision",

            "module":
                "Decision",

            "status":
                decision.status,

            "date":
                decision.created_at.strftime("%d-%m-%Y")

        })

    return {

        "message":
            f"Welcome {current_user.full_name}",

        "email":
            current_user.email,

        "role":
            current_user.role,

        "total_users":
            total_users,

        "total_decisions":
            total_decisions,

        "draft_decisions":
            draft_decisions,

        "pending_decisions":
            pending_decisions,

        "approved_decisions":
            approved_decisions,

        "rejected_decisions":
            rejected_decisions,

        "total_discussions":
            total_discussions,

        "total_knowledge_articles":
            total_knowledge_articles,

        "pending_approvals":
            pending_approvals,

        "approved_approvals":
            approved_approvals,

        "rejected_approvals":
            rejected_approvals,

        "recent_activities":
            recent_activities

    }