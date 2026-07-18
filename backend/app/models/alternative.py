"""
Expert Decision Replay Platform - Alternative Model

Defines the alternatives table for the Alternative Analysis module.
Each decision has 1+ alternatives, each with pros/cons, cost, feasibility, and risk.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, DateTime, Integer, Boolean, Numeric, Enum, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database.base import Base
from app.models.decision import ImpactLevel  # reuse for risk_level
from sqlalchemy.orm import relationship


class Alternative(Base):
    """
    Alternative option within a decision.

    Attributes:
        id: Unique alternative identifier (UUID).
        decision_id: FK to decisions table.
        title: Short title for this alternative.
        description: Detailed description.
        pros: JSON array of pro points.
        cons: JSON array of con points.
        estimated_cost: Estimated cost (numeric).
        feasibility_score: Score from 1–10.
        risk_level: Low/Medium/High risk classification.
        is_recommended: Whether this is the recommended alternative.
        created_at / updated_at: Timestamps.
    """
    __tablename__ = "alternatives"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    decision_id = Column(
        UUID(as_uuid=True),
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    pros = Column(JSONB, nullable=False, default=list)
    cons = Column(JSONB, nullable=False, default=list)
    estimated_cost = Column(Numeric(15, 2), nullable=True)
    feasibility_score = Column(Integer, nullable=True)
    risk_level = Column(
        Enum(ImpactLevel, name="impact_level", create_type=False),
        default=ImpactLevel.MEDIUM,
        nullable=False,
    )
    is_recommended = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    decision = relationship("Decision", back_populates="alternatives")

    def __repr__(self) -> str:
        return f"<Alternative(id={self.id}, title={self.title}, recommended={self.is_recommended})>"
