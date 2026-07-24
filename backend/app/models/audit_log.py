"""
models/audit_log.py

AuditLog — immutable, append-only record of every significant action
across the platform.

Deliberately excludes SoftDeleteMixin and updated_at: an audit log entry
must never be deletable or modifiable by application code. This is the
one entity in the schema that intentionally breaks the "every table gets
the same mixins" rule, because audit immutability is a functional
requirement, not just a convention.
"""

import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class AuditLog(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "audit_logs"

    # Nullable: some actions (system-triggered escalations, scheduled
    # jobs) have no human actor.
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # e.g. "user.created", "decision.status_changed", "approval.approved"
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Generic polymorphic reference, unenforced by a DB FK on purpose —
    # an audit log must reference any current or historical entity type,
    # including ones since deleted, without ever being blocked.
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    # Flexible before/after diff payload, e.g. {"before": {...}, "after": {...}}.
    log_metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(INET, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # --- Relationships ---
    actor: Mapped[Optional["User"]] = relationship(back_populates="audit_logs")

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id} action={self.action} entity_type={self.entity_type}>"

