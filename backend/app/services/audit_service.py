"""
Expert Decision Replay Platform - Audit Service

Provides a single entry-point for writing immutable audit log entries.
Every state-changing action in the platform must call AuditService.log().
"""

from typing import Optional, Any
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


class AuditService:
    """Service for writing audit trail entries."""

    @staticmethod
    def log(
        db: Session,
        *,
        entity_type: str,
        entity_id: UUID,
        action: str,
        performed_by: UUID,
        old_value: Optional[Any] = None,
        new_value: Optional[Any] = None,
    ) -> AuditLog:
        """
        Create an immutable audit log entry.

        Args:
            db: Database session.
            entity_type: "decision", "approval", etc.
            entity_id: UUID of the affected entity.
            action: Machine-readable action name (e.g. "submit", "approve").
            performed_by: UUID of the acting user.
            old_value: Previous state snapshot (JSONB-serializable).
            new_value: New state snapshot (JSONB-serializable).

        Returns:
            The created AuditLog entry (not yet committed — caller owns the transaction).
        """
        entry = AuditLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            old_value=old_value,
            new_value=new_value,
            performed_by=performed_by,
        )
        db.add(entry)
        return entry
