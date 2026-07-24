"""
Expert Decision Replay Platform - Approval Service

Business logic for the multi-level sequential approval workflow.

Rules enforced:
  - Only the decision owner can assign approvers (while decision is in DRAFT).
  - Owner cannot assign themselves as an approver.
  - On submit, Approval rows must already exist; submit validates ≥ 1 level configured.
  - Approvals are sequential: level N+1 is actionable only after level N approves.
  - Only the assigned approver for a level can act on it.
  - Rejecting at ANY level immediately sets Decision.status = REJECTED
    and cancels all remaining PENDING approvals.
  - When all levels approve, Decision.status flips to APPROVED.
  - Request-changes sends the decision back to DRAFT and cancels approvals.
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.approval import Approval, ApprovalStatus
from app.models.decision import Decision, DecisionStatus
from app.models.user import User
from app.schemas.approval import ApproverAssign, ApprovalAction, ApprovalActionType
from app.services.audit_service import AuditService
from app.services.workflow import transition_guard, log_audit_event


class ApprovalService:
    """Service for managing the approval workflow."""

    # ------------------------------------------------------------------ #
    #  ASSIGN APPROVERS (before submit, while DRAFT)                       #
    # ------------------------------------------------------------------ #
    @staticmethod
    def assign_approver(
        db: Session,
        decision_id: UUID,
        data: ApproverAssign,
        current_user: User,
    ) -> Approval:
        """
        Assign an approver to a decision at a specific level.

        Validations:
          - Decision exists and is in DRAFT.
          - Current user is the decision owner.
          - Approver exists and is not the owner (no self-approval).
          - Level is not already taken for this decision.
        """
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Decision not found",
            )

        from app.api.deps import can_access_decision
        can_access_decision(current_user, decision, db)

        if decision.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the decision owner can assign approvers",
            )

        if decision.status != DecisionStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approvers can only be assigned to draft decisions",
            )

        # Self-approval guard
        if data.approver_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Owner cannot assign themselves as an approver",
            )

        # Verify approver exists
        approver = db.query(User).filter(User.id == data.approver_id).first()
        if not approver:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approver user not found",
            )

        # Check level not already taken
        existing = (
            db.query(Approval)
            .filter(
                Approval.decision_id == decision_id,
                Approval.level == data.level,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Level {data.level} is already assigned for this decision",
            )

        approval = Approval(
            decision_id=decision_id,
            approver_id=data.approver_id,
            level=data.level,
            status=ApprovalStatus.PENDING,
        )
        db.add(approval)

        AuditService.log(
            db,
            entity_type="approval",
            entity_id=approval.id,
            action="assign_approver",
            performed_by=current_user.id,
            new_value={
                "decision_id": str(decision_id),
                "approver_id": str(data.approver_id),
                "level": data.level,
            },
        )

        db.commit()
        db.refresh(approval)
        return approval

    # ------------------------------------------------------------------ #
    #  REMOVE APPROVER (while DRAFT)                                       #
    # ------------------------------------------------------------------ #
    @staticmethod
    def remove_approver(
        db: Session,
        decision_id: UUID,
        approval_id: UUID,
        current_user: User,
    ) -> None:
        """Remove an approver assignment (only while decision is in DRAFT)."""
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Decision not found",
            )

        from app.api.deps import can_access_decision
        can_access_decision(current_user, decision, db)

        if decision.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the decision owner can manage approvers",
            )

        if decision.status != DecisionStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify approvers after submission",
            )

        approval = (
            db.query(Approval)
            .filter(Approval.id == approval_id, Approval.decision_id == decision_id)
            .first()
        )
        if not approval:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Approval assignment not found",
            )

        db.delete(approval)
        db.commit()

    # ------------------------------------------------------------------ #
    #  LIST APPROVALS                                                      #
    # ------------------------------------------------------------------ #
    @staticmethod
    def list_approvals(db: Session, decision_id: UUID, current_user: User) -> List[Approval]:
        """List all approval rows for a decision, ordered by level."""
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Decision not found",
            )
        from app.api.deps import can_access_decision
        can_access_decision(current_user, decision, db)
        return (
            db.query(Approval)
            .filter(Approval.decision_id == decision_id)
            .order_by(Approval.level)
            .all()
        )

    # ------------------------------------------------------------------ #
    #  ACT ON APPROVAL                                                     #
    # ------------------------------------------------------------------ #
    @staticmethod
    def act_on_approval(
        db: Session,
        decision_id: UUID,
        approval_id: UUID,
        action_data: ApprovalAction,
        current_user: User,
    ) -> Approval:
        """
        Act on a pending approval (approve, reject, or request changes).
        """
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Decision not found",
            )

        from app.api.deps import can_access_decision
        can_access_decision(current_user, decision, db)

        if decision.status != DecisionStatus.UNDER_REVIEW:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Decision is not under review",
            )

        approval = (
            db.query(Approval)
            .filter(Approval.id == approval_id, Approval.decision_id == decision_id)
            .first()
        )
        if not approval:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Approval not found",
            )

        if current_user.id != approval.approver_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to act on this approval",
            )

        if approval.status != ApprovalStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Approval is no longer pending (current status: {approval.status.value})",
            )

        # Sequential enforcement
        lower_pending = (
            db.query(func.count(Approval.id))
            .filter(
                Approval.decision_id == decision_id,
                Approval.level < approval.level,
                Approval.status != ApprovalStatus.APPROVED,
            )
            .scalar()
        )
        if lower_pending > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Previous approval levels have not been completed yet",
            )

        old_status = approval.status.value
        approval.comments = action_data.comments
        approval.acted_at = datetime.now(timezone.utc)
        
        if action_data.action == ApprovalActionType.APPROVED:
            approval.status = ApprovalStatus.APPROVED
            db.flush()
            
            # Check if all levels are approved
            remaining_pending = (
                db.query(func.count(Approval.id))
                .filter(
                    Approval.decision_id == decision_id,
                    Approval.status == ApprovalStatus.PENDING,
                )
                .scalar()
            )
            if remaining_pending == 0:
                transition_guard(decision.status, DecisionStatus.APPROVED)
                old_dec_status = decision.status.value
                decision.status = DecisionStatus.APPROVED
                
                log_audit_event(
                    db, "decision", decision.id, current_user.id, "status_change", 
                    {"status": {"old": old_dec_status, "new": decision.status.value}}
                )

        elif action_data.action == ApprovalActionType.REJECTED:
            approval.status = ApprovalStatus.REJECTED
            
            # Cancel only higher-level approvals (exclude current)
            remaining = db.query(Approval).filter(
                Approval.decision_id == decision_id,
                Approval.status == ApprovalStatus.PENDING,
                Approval.id != approval.id,
            ).all()
            for r in remaining:
                r.status = ApprovalStatus.CANCELLED
                r.acted_at = datetime.now(timezone.utc)
                
            transition_guard(decision.status, DecisionStatus.REJECTED)
            old_dec_status = decision.status.value
            decision.status = DecisionStatus.REJECTED
            
            log_audit_event(
                db, "decision", decision.id, current_user.id, "status_change", 
                {"status": {"old": old_dec_status, "new": decision.status.value}, "reason": action_data.comments}
            )

        elif action_data.action == ApprovalActionType.CHANGES_REQUESTED:
            approval.status = ApprovalStatus.CANCELLED # Or another status like REJECTED, but prompt says sends back to DRAFT
            
            # Cancel all approvals
            all_approvals = db.query(Approval).filter(Approval.decision_id == decision_id).all()
            for a in all_approvals:
                a.status = ApprovalStatus.CANCELLED
                a.acted_at = datetime.now(timezone.utc)
                
            transition_guard(decision.status, DecisionStatus.DRAFT)
            old_dec_status = decision.status.value
            decision.status = DecisionStatus.DRAFT
            
            log_audit_event(
                db, "decision", decision.id, current_user.id, "request_changes", 
                {"status": {"old": old_dec_status, "new": decision.status.value}, "comments": action_data.comments}
            )

        # Log approval action
        log_audit_event(
            db, "approval", approval.id, current_user.id, "act_on_approval",
            {"status": {"old": old_status, "new": approval.status.value}, "action": action_data.action.value, "comments": action_data.comments}
        )

        db.commit()
        db.refresh(approval)
        return approval
