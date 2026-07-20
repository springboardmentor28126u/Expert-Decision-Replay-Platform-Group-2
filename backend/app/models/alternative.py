"""Alternative model — maps to existing 'alternatives' table with new columns."""

from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Alternative(Base):
    """Alternative model for decision alternatives.

    Existing columns: id, decision_id, name, cost, quality, risk
    New columns (added via migration): pros, cons, feasibility
    """

    __tablename__ = "alternatives"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=True)
    name = Column(String, nullable=False)
    pros = Column(Text, nullable=True)       # NEW — added via migration
    cons = Column(Text, nullable=True)       # NEW — added via migration
    cost = Column(Integer, nullable=True)
    quality = Column(Integer, nullable=True)
    risk = Column(Integer, nullable=True)
    feasibility = Column(Integer, nullable=True)  # NEW — added via migration

    # Relationships
    decision = relationship("Decision", back_populates="alternatives")

    def __repr__(self) -> str:
        return f"<Alternative(id={self.id}, name='{self.name}')>"
