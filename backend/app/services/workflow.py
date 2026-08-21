"""
Expert Decision Replay Platform - Workflow Service

Handles transition logic, state machine guards, audit logging, and escalations.
"""

import json
import logging
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.decision import DecisionStatus, Decision
from app.models.audit_log import AuditLog

logger = logging.getLogger("expert_decision")

# Allowed transitions from a given state
ALLOWED_TRANSITIONS = {
    DecisionStatus.DRAFT: {DecisionStatus.UNDER_REVIEW, DecisionStatus.ARCHIVED},
    DecisionStatus.UNDER_REVIEW: {DecisionStatus.APPROVED, DecisionStatus.REJECTED, DecisionStatus.DRAFT},
    DecisionStatus.APPROVED: {DecisionStatus.ARCHIVED},
    DecisionStatus.REJECTED: {DecisionStatus.UNDER_REVIEW, DecisionStatus.DRAFT},
    DecisionStatus.ARCHIVED: set()
}

def transition_guard(current_status: DecisionStatus, target_status: DecisionStatus) -> None:
    """
    Validates if a decision can transition from current_status to target_status.
    Raises a 409 Conflict if the transition is not allowed.
    """
    allowed_targets = ALLOWED_TRANSITIONS.get(current_status, set())
    if target_status not in allowed_targets:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Invalid state transition from {current_status.value} to {target_status.value}."
        )


def log_audit_event(
    db: Session,
    entity_type: str,
    entity_id: UUID,
    performed_by: UUID,
    action: str,
    diff: dict = None,
    company_id: UUID = None,
) -> AuditLog:
    """
    Writes a standardized audit log entry.
    Splits the diff dict into old_value and new_value where possible.
    Must be called within an active transaction so it commits together with the change.
    """
    old_value = None
    new_value = diff or {}

    # If diff contains nested dicts with 'old'/'new' keys, split them
    # Handle both single-key and multi-key diffs
    if diff and isinstance(diff, dict):
        old_parts = {}
        new_parts = {}
        has_old_new = False
        for key, val in diff.items():
            if isinstance(val, dict) and "old" in val and "new" in val:
                old_parts[key] = val["old"]
                new_parts[key] = val["new"]
                has_old_new = True
            else:
                new_parts[key] = val
        if has_old_new:
            old_value = old_parts if old_parts else None
            new_value = new_parts

    log_entry = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        performed_by=performed_by,
        action=action,
        old_value=old_value,
        new_value=new_value,
        company_id=company_id,
    )
    db.add(log_entry)
    return log_entry


def run_escalation_job(db: Session):
    """
    Stub for an escalation job that checks for pending approvals past their SLA deadline.
    In a real system, this would be a Celery beat task.
    """
    logger.info("Running escalation job stub...")
    # Find Approval.status = pending AND sla_deadline < now()
    # For now, just a stub.
    pass
