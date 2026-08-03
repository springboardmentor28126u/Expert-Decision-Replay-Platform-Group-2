from sqlalchemy.orm import Session

from app.models.decision import Decision
from app.models.user import User
from app.models.approval import Approval


class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def get_summary(self):
        total_decisions = self.db.query(Decision).count()

        approved = self.db.query(Decision).filter(
            Decision.status == "Approved"
        ).count()

        rejected = self.db.query(Decision).filter(
            Decision.status == "Rejected"
        ).count()

        draft = self.db.query(Decision).filter(
            Decision.status == "Draft"
        ).count()

        under_review = self.db.query(Decision).filter(
            Decision.status == "Under Review"
        ).count()

        archived = self.db.query(Decision).filter(
            Decision.status == "Archived"
        ).count()

        total_users = self.db.query(User).count()
        total_approvals = self.db.query(Approval).count()

        return {
            "total_decisions": total_decisions,
            "approved": approved,
            "rejected": rejected,
            "draft": draft,
            "under_review": under_review,
            "archived": archived,
            "total_users": total_users,
            "total_approvals": total_approvals,
        }