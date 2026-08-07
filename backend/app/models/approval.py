from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)

    decision_id = Column(Integer, ForeignKey("decisions.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    level = Column(Integer, default=1)
    status = Column(String(50), default="Pending")
    remarks = Column(String(255), nullable=True)

    approved_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    decision = relationship("Decision")
    reviewer = relationship("User", foreign_keys=[reviewer_id])