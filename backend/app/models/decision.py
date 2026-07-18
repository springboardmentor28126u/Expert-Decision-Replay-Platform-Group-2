"""
Expert Decision Replay Platform - Decision Model

Defines the decisions table — the core entity of the platform.
Every decision moves through: DRAFT → UNDER_REVIEW → APPROVED/REJECTED → ARCHIVED.
"""

import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, DateTime, Date, Integer, Boolean, Enum, ForeignKey, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database.base import Base


class DecisionStatus(str, enum.Enum):
    """Decision lifecycle statuses."""
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class ImpactLevel(str, enum.Enum):
    """Impact level of a decision."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ImplementationStatus(str, enum.Enum):
    """Post-approval implementation tracking."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class DecisionOutcome(str, enum.Enum):
    """Final outcome of an implemented decision."""
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"
    PENDING = "pending"


class Decision(Base):
    """
    Decision model — the central entity.

    Attributes:
        id: Unique decision identifier (UUID).
        title: Short decision title.
        problem_statement: Detailed description of the problem.
        category_id: FK to decision_categories table.
        status: Current lifecycle status.
        impact_level: Low/Medium/High impact classification.
        created_by: FK to users — the decision creator.
        current_version: Current version number (incremented on submit).
        locked: Whether the decision is locked from editing.
        target_date: Target date for making the decision.
        stakeholder_ids: Optional JSON array of user IDs tagged as stakeholders.
        implementation_status: Post-approval tracking status.
        outcome: Final outcome after implementation.
        outcome_notes: Free-text notes about the outcome.
        created_at / updated_at: Timestamps.
    """
    __tablename__ = "decisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    problem_statement = Column(Text, nullable=False)
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("decision_categories.id"),
        nullable=False,
    )
    status = Column(
        Enum(DecisionStatus, name="decision_status"),
        default=DecisionStatus.DRAFT,
        nullable=False,
        index=True,
    )
    impact_level = Column(
        Enum(ImpactLevel, name="impact_level"),
        default=ImpactLevel.MEDIUM,
        nullable=False,
    )
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    current_version = Column(Integer, default=1, nullable=False)
    locked = Column(Boolean, default=False, nullable=False)
    target_date = Column(Date, nullable=True)
    stakeholder_ids = Column(JSONB, nullable=True, default=list)
    implementation_status = Column(
        Enum(ImplementationStatus, name="implementation_status"),
        default=ImplementationStatus.NOT_STARTED,
        nullable=False,
    )
    outcome = Column(
        Enum(DecisionOutcome, name="decision_outcome"),
        nullable=True,
    )
    outcome_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    creator = relationship("User", backref="decisions", lazy="joined")
    category = relationship("DecisionCategory", back_populates="decisions", lazy="joined")
    alternatives = relationship(
        "Alternative",
        back_populates="decision",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Alternative.created_at",
    )
    versions = relationship(
        "DecisionVersion",
        back_populates="decision",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="DecisionVersion.version_number.desc()",
    )

    # Composite index for dashboard filters
    __table_args__ = (
        Index("ix_decisions_status_category_creator", "status", "category_id", "created_by"),
    )

    def __repr__(self) -> str:
        return f"<Decision(id={self.id}, title={self.title}, status={self.status})>"
