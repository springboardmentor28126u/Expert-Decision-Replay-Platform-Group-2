"""
Expert Decision Replay Platform - Decision Version Model

Defines the decision_versions table for version history.
A snapshot is created on every submit or edit-after-submit,
capturing the full decision state as JSONB.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database.base import Base


class DecisionVersion(Base):
    """
    Immutable snapshot of a decision at a point in time.

    Attributes:
        id: Unique version identifier (UUID).
        decision_id: FK to decisions table.
        version_number: Sequential version number.
        snapshot_json: Full decision state serialized as JSONB.
        change_summary: Optional human-readable summary of what changed.
        created_by: FK to users — who triggered this version.
        created_at: Timestamp of snapshot creation.
    """
    __tablename__ = "decision_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    decision_id = Column(
        UUID(as_uuid=True),
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_number = Column(Integer, nullable=False)
    snapshot_json = Column(JSONB, nullable=False)
    change_summary = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    decision = relationship("Decision", back_populates="versions")
    creator = relationship("User", lazy="joined")

    def __repr__(self) -> str:
        return f"<DecisionVersion(decision_id={self.decision_id}, v{self.version_number})>"
