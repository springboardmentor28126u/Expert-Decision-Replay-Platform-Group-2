"""
Expert Decision Replay Platform - Approval Chain Config Model

Defines the configuration for the approval workflow chain for decision categories.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database.base import Base


class ApprovalChainConfig(Base):
    """
    Configuration for approval chains based on category.

    Attributes:
        id: Unique identifier.
        category_id: FK to decision_categories.
        roles: JSON array of roles specifying the order of approvals.
               Example: ["manager", "admin"]
        sla_hours: Optional SLA in hours for escalation tracking.
        created_at: Timestamp when created.
    """
    __tablename__ = "approval_chain_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("decision_categories.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    roles = Column(JSONB, nullable=False, default=list)
    sla_hours = Column(Integer, nullable=True, default=24)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    category = relationship("DecisionCategory")

    def __repr__(self) -> str:
        return f"<ApprovalChainConfig(category_id={self.category_id}, roles={self.roles})>"
