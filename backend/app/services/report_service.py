from sqlalchemy.orm import Session

from app.models.decision import Decision
from app.models.user import User
from app.models.approval import Approval


class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def get_summary(self):
        return {
            "total_decisions": self.db.query(Decision).count(),
            "approved": self.db.query(Decision).filter(
                Decision.status == "Approved"
            ).count(),
            "rejected": self.db.query(Decision).filter(
                Decision.status == "Rejected"
            ).count(),
            "draft": self.db.query(Decision).filter(
                Decision.status == "Draft"
            ).count(),
            "under_review": self.db.query(Decision).filter(
                Decision.status == "Under Review"
            ).count(),
            "archived": self.db.query(Decision).filter(
                Decision.status == "Archived"
            ).count(),
            "total_users": self.db.query(User).count(),
            "total_approvals": self.db.query(Approval).count(),
        }

    def get_approval_report(self):
        approvals = self.db.query(Approval).all()

        return [
            {
                "id": approval.id,
                "decision_id": approval.decision_id,
                "reviewer_id": approval.reviewer_id,
                "status": approval.status,
                "comments": approval.comments,
                "created_at": approval.created_at,
                "approved_at": approval.approved_at,
            }
            for approval in approvals
        ]

    def get_team_report(self):
        users = self.db.query(User).all()

        return [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
            }
            for user in users
        ]

    def get_audit_report(self):
        decisions = self.db.query(Decision).all()

        return [
            {
                "id": decision.id,
                "title": decision.title,
                "status": decision.status,
                "created_by": decision.created_by,
                "created_at": decision.created_at,
                "updated_at": decision.updated_at,
            }
            for decision in decisions
        ]