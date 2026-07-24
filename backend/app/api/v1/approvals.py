"""
Expert Decision Replay Platform - Approvals Router

Endpoints for managing decision approvers, approving, rejecting,
and requesting changes on decisions under review.
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.approval import ApproverAssign, ApprovalAction, ApprovalResponse
from app.schemas.common import MessageResponse
from app.schemas.audit_log import AuditLogResponse
from app.services.approval_service import ApprovalService
from app.models.user import User
from app.models.decision import Decision
from app.models.audit_log import AuditLog
from app.api.deps import get_current_user, can_access_decision

router = APIRouter()


def _approval_to_response(approval) -> ApprovalResponse:
    """Convert an Approval ORM object to a response with computed fields."""
    resp = ApprovalResponse.model_validate(approval)
    resp.approver_name = approval.approver.full_name if approval.approver else None
    return resp


# ------------------------------------------------------------------ #
#  APPROVER MANAGEMENT (owner assigns before submit)                   #
# ------------------------------------------------------------------ #

@router.post(
    "/{decision_id}/approvers",
    response_model=ApprovalResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_approver(
    decision_id: UUID,
    data: ApproverAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign an approver to a decision at a specific level (DRAFT only)."""
    approval = ApprovalService.assign_approver(db, decision_id, data, current_user)
    return _approval_to_response(approval)


@router.delete(
    "/{decision_id}/approvers/{approval_id}",
    response_model=MessageResponse,
)
def remove_approver(
    decision_id: UUID,
    approval_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove an approver assignment (DRAFT only)."""
    ApprovalService.remove_approver(db, decision_id, approval_id, current_user)
    return {"message": "Approver removed successfully"}


@router.get(
    "/{decision_id}/approvals",
    response_model=List[ApprovalResponse],
)
def list_approvals(
    decision_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all approval rows for a decision."""
    approvals = ApprovalService.list_approvals(db, decision_id, current_user)
    return [_approval_to_response(a) for a in approvals]


# ------------------------------------------------------------------ #
#  APPROVAL ACTIONS                                                    #
# ------------------------------------------------------------------ #

@router.post(
    "/{decision_id}/approvals/{approval_id}",
    response_model=ApprovalResponse,
)
def act_on_approval(
    decision_id: UUID,
    approval_id: UUID,
    body: ApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Act on a pending approval (approve, reject, or request changes).
    """
    approval = ApprovalService.act_on_approval(db, decision_id, approval_id, body, current_user)
    return _approval_to_response(approval)


# ------------------------------------------------------------------ #
#  AUDIT LOG                                                           #
# ------------------------------------------------------------------ #

@router.get(
    "/{decision_id}/audit-log",
    response_model=List[AuditLogResponse],
)
def get_decision_audit_log(
    decision_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the full audit trail for a decision (includes approval actions)."""
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        from fastapi import HTTPException as _HTTPException
        from fastapi import status as _status
        raise _HTTPException(status_code=_status.HTTP_404_NOT_FOUND, detail="Decision not found")
    can_access_decision(current_user, decision, db)

    logs = (
        db.query(AuditLog)
        .filter(
            AuditLog.entity_id == decision_id,
        )
        .order_by(AuditLog.created_at.desc())
        .all()
    )
    result = []
    for log in logs:
        item = AuditLogResponse.model_validate(log)
        item.performer_name = log.performer.full_name if log.performer else None
        result.append(item)
    return result
