"""DecisionHistory model — maps to existing 'decision_history' table with new column."""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.database import Base


class DecisionHistory(Base):
    """Version tracking for decisions.

    Existing columns: id, decision_id, old_title, old_description, updated_by, updated_at
    New columns (added via migration): changed_fields (JSONB)
    """

    __tablename__ = "decision_history"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=True)
    old_title = Column(String, nullable=True)
    old_description = Column(Text, nullable=True)
    changed_fields = Column(JSONB, nullable=True)  
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    
    decision = relationship("Decision", back_populates="history")
    updater = relationship("User", back_populates="history_entries")

    def __repr__(self) -> str:
        return f"<DecisionHistory(id={self.id}, decision_id={self.decision_id})>"
