from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class AIReviewResult(Base):
    __tablename__ = "ai_review_results"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    problem_status = Column(String(20))      # complete / incomplete / missing
    problem_note = Column(Text)

    alternatives_status = Column(String(20))
    alternatives_note = Column(Text)

    cost_status = Column(String(20))
    cost_note = Column(Text)

    risk_status = Column(String(20))
    risk_note = Column(Text)

    documents_status = Column(String(20))
    documents_note = Column(Text)

    overall_summary = Column(Text)

    requested_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    decision = relationship("Decision")
    reviewer = relationship("User")