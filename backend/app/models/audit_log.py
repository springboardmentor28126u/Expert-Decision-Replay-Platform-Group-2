"""
Expert Decision Replay Platform - Audit Log Model

Immutable log of every state-changing action in the platform.
Used for compliance, debugging, and decision replay.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database.base import Base


class AuditLog(Base):
    """
    Immutable audit trail entry.

    Attributes:
        id: Unique log entry identifier (UUID).
        entity_type: Type of entity (e.g. "decision", "approval").
        entity_id: UUID of the affected entity.
        action: Action performed (e.g. "status_change", "approve", "reject",
                "submit", "edit", "archive", "request_changes").
        old_value: Previous state as JSONB (nullable for create actions).
        new_value: New state as JSONB.
        performed_by: FK to users â€” who performed this action.
        created_at: Timestamp of the action.
    """
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)
    old_value = Column(JSONB, nullable=True)
    new_value = Column(JSONB, nullable=True)
    performed_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=True,
        index=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    performer = relationship("User", lazy="joined")

    def __repr__(self) -> str:
        return (
            f"<AuditLog(entity={self.entity_type}:{self.entity_id}, "
            f"action={self.action})>"
        )
