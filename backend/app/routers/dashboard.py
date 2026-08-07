"""Dashboard router — summary metrics & stats."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.decision import Decision

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_decisions = db.query(func.count(Decision.id)).scalar() or 0
    draft_count = db.query(func.count(Decision.id)).filter(Decision.status == "Draft").scalar() or 0
    under_review_count = db.query(func.count(Decision.id)).filter(Decision.status == "Under Review").scalar() or 0
    approved_count = db.query(func.count(Decision.id)).filter(Decision.status == "Approved").scalar() or 0
    rejected_count = db.query(func.count(Decision.id)).filter(Decision.status == "Rejected").scalar() or 0

    return {
        "cards": {
            "total_decisions": total_decisions,
            "pending_approvals": under_review_count,
            "approved_decisions": approved_count,
            "replays_count": total_decisions,
            "active_users": db.query(func.count(User.id)).scalar() or 0,
        },
        "stats": {
            "draft": draft_count,
            "under_review": under_review_count,
            "approved": approved_count,
            "rejected": rejected_count,
        }
    }
