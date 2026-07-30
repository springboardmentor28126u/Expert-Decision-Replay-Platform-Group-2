from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.decision import Decision
from app.models.alternative import Alternative
from app.models.file import File
from app.models.discussion import Discussion
from app.models.version import Version

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# ==========================
# Dashboard Statistics
# ==========================
@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):

    total = db.query(Decision).count()

    approved = db.query(Decision).filter(
        Decision.status == "Approved"
    ).count()

    pending = db.query(Decision).filter(
        Decision.status == "Pending"
    ).count()

    rejected = db.query(Decision).filter(
        Decision.status == "Rejected"
    ).count()

    recent = (
        db.query(Decision)
        .order_by(Decision.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total": total,
        "approved": approved,
        "pending": pending,
        "rejected": rejected,
        "recent": recent
    }


# ==========================
# Reports
# ==========================
@router.get("/reports")
def reports(db: Session = Depends(get_db)):

    total = db.query(Decision).count()

    approved = db.query(Decision).filter(
        Decision.status == "Approved"
    ).count()

    pending = db.query(Decision).filter(
        Decision.status == "Pending"
    ).count()

    rejected = db.query(Decision).filter(
        Decision.status == "Rejected"
    ).count()

    alternatives = db.query(Alternative).count()

    files = db.query(File).count()

    discussions = db.query(Discussion).count()

    versions = db.query(Version).count()

    recent = (
        db.query(Decision)
        .order_by(Decision.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total": total,
        "approved": approved,
        "pending": pending,
        "rejected": rejected,
        "alternatives": alternatives,
        "files": files,
        "discussions": discussions,
        "versions": versions,
        "recent": recent
    }