from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class Approval(Base):
    """Approval model for decision approval workflow."""

    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False
    )

    reviewer_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    status = Column(
        String(30),
        default="Pending"
    )

    comments = Column(Text, nullable=True)

    approved_at = Column(DateTime, nullable=True)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    # Relationships
    decision = relationship("Decision")
    reviewer = relationship("User")

    def __repr__(self):
        return (
            f"<Approval(id={self.id}, "
            f"decision_id={self.decision_id}, "
            f"status='{self.status}')>"
        )