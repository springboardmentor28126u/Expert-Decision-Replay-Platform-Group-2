"""
services/approval_service.py

Business logic for approval workflow.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.approval import Approval
from app.models.decision import Decision
from app.models.enums import ApprovalStatus, DecisionStatus, NotificationType, RoleName
from app.models.user import User

from app.repositories.approval_repository import ApprovalRepository
from app.repositories.decision_repository import DecisionRepository
from app.repositories.decision_version_repository import DecisionVersionRepository
from app.repositories.user_repository import UserRepository

from app.schemas.approval import (
    ApprovalAssign,
    ApprovalDecision,
    ApprovalOut,
)

from app.services.audit_log_service import AuditLogService
from app.services.notification_service import NotificationService

from app.utils.exceptions import (
    ConflictException,
    NotFoundException,
    PermissionDeniedException,
    ValidationException,
)

logger = logging.getLogger("edrp.approvals")


class ApprovalService:

    def __init__(
        self,
        db: AsyncSession,
    ) -> None:

        self.db = db

        self.approvals = ApprovalRepository(db)
        self.decisions = DecisionRepository(db)
        self.versions = DecisionVersionRepository(db)
        self.users = UserRepository(db)
        self.notifications = NotificationService(db)
        self.audit_logs = AuditLogService(db)

    # --------------------------------------------------
    # Decision lifecycle (derived from approval state)
    # --------------------------------------------------

    async def _sync_decision_status(
        self,
        decision_id: uuid.UUID,
        changed_by_id: uuid.UUID | None,
    ) -> Optional[Decision]:
        """
        Recomputes Decision.status from the current set of Approval rows.
        This is the single source of truth for the derivation — called
        after every action that changes an approval's status (review,
        reset) so Decision.status never drifts from the approvals that
        justify it.

        Decisions with zero approvals are left untouched: assigning a
        reviewer alone doesn't constitute a review outcome, so a Decision
        with no approvals yet has nothing to derive from.

        Returns the Decision if its status actually changed (so callers
        can fire a DECISION_STATUS_CHANGE notification off the same
        recompute, without re-deriving anything), or None if nothing
        changed.
        """
        decision = await self.decisions.get_by_id(decision_id)

        if decision is None:
            return None

        approvals = await self.approvals.list_by_decision(decision_id)

        if not approvals:
            return None

        if any(a.status == ApprovalStatus.REJECTED for a in approvals):
            target_status = DecisionStatus.REJECTED
        elif all(a.status == ApprovalStatus.APPROVED for a in approvals):
            target_status = DecisionStatus.APPROVED
        else:
            target_status = DecisionStatus.UNDER_REVIEW

        if decision.status == target_status:
            return None

        await self.versions.create_snapshot(
            decision=decision,
            changed_by_id=changed_by_id,
        )

        decision.status = target_status
        decision.version += 1

        return decision

    # --------------------------------------------------
    # Notifications (best-effort — never affects workflow state)
    # --------------------------------------------------

    async def _notify_safely(
        self,
        *,
        recipient_id: uuid.UUID,
        notification_type: NotificationType,
        title: str,
        message: str,
        related_entity_type: str,
        related_entity_id: uuid.UUID,
    ) -> None:
        """
        Notification delivery is best-effort: a failure here must never
        surface to the caller or undo an already-committed approval/
        decision state change. Called only after the workflow's own
        commit has already succeeded, so there is nothing to roll back —
        a failure here only affects the notification row itself.
        """
        try:
            await self.notifications.create_notification(
                recipient_id=recipient_id,
                notification_type=notification_type,
                title=title,
                message=message,
                related_entity_type=related_entity_type,
                related_entity_id=related_entity_id,
            )
        except Exception:
            logger.exception(
                "Failed to create notification (type=%s, recipient=%s, "
                "related_entity=%s:%s); workflow state is unaffected.",
                notification_type.value,
                recipient_id,
                related_entity_type,
                related_entity_id,
            )
            await self.db.rollback()

    async def _resolve_escalation_recipients(
        self,
        decision_id: uuid.UUID,
    ) -> list[uuid.UUID]:
        """
        Escalation goes to the Decision's Team manager when one exists;
        otherwise it falls back to every active Administrator, since
        there's no single "the administrator" in this data model (Role
        is a lookup table — multiple users can hold that role).
        """
        decision = await self.decisions.get_by_id(decision_id)

        if decision is not None and decision.team is not None and decision.team.manager_id is not None:
            return [decision.team.manager_id]

        administrators = await self.users.list_active_by_role_name(
            RoleName.ADMINISTRATOR.value
        )

        return [admin.id for admin in administrators]

    # --------------------------------------------------
    # Queries
    # --------------------------------------------------

    async def list_approvals(
        self,
        decision_id: uuid.UUID,
    ) -> list[ApprovalOut]:

        decision = await self.decisions.get_by_id(
            decision_id
        )

        if decision is None:
            raise NotFoundException(
                "Decision not found."
            )

        approvals = await self.approvals.list_by_decision(
            decision_id
        )

        return [
            ApprovalOut.model_validate(a)
            for a in approvals
        ]

    async def get_approval(
        self,
        approval_id: uuid.UUID,
    ) -> ApprovalOut:

        approval = await self.approvals.get_by_id(
            approval_id
        )

        if approval is None:
            raise NotFoundException(
                "Approval not found."
            )

        return ApprovalOut.model_validate(
            approval
        )

    # --------------------------------------------------
    # Assignment
    # --------------------------------------------------

    async def assign_reviewer(
        self,
        decision_id: uuid.UUID,
        payload: ApprovalAssign,
    ) -> ApprovalOut:

        decision = await self.decisions.get_by_id(
            decision_id
        )

        if decision is None:
            raise NotFoundException(
                "Decision not found."
            )

        reviewer = await self.users.get_by_id(
            payload.reviewer_id
        )

        if reviewer is None:
            raise NotFoundException(
                "Reviewer not found."
            )

        existing = await self.approvals.find_assignment(
            decision_id,
            payload.reviewer_id,
            payload.level,
        )

        if existing is not None:
            raise ConflictException(
                "Reviewer already assigned."
            )

        approval = Approval(
            decision_id=decision_id,
            reviewer_id=payload.reviewer_id,
            level=payload.level,
            status=ApprovalStatus.PENDING,
        )

        self.approvals.add(
            approval
        )

        await self.db.commit()

        await self._notify_safely(
            recipient_id=payload.reviewer_id,
            notification_type=NotificationType.APPROVAL_REQUEST,
            title="New review assignment",
            message=(
                f'You have been assigned to review "{decision.title}" '
                f"at level {payload.level}."
            ),
            related_entity_type="approval",
            related_entity_id=approval.id,
        )

        created = await self.approvals.get_by_id(
            approval.id
        )

        return ApprovalOut.model_validate(
            created
        )

    # --------------------------------------------------
    # Review
    # --------------------------------------------------

    async def review_decision(
        self,
        approval_id: uuid.UUID,
        payload: ApprovalDecision,
        current_user: User,
    ) -> ApprovalOut:

        approval = await self.approvals.get_by_id(
            approval_id
        )

        if approval is None:
            raise NotFoundException(
                "Approval not found."
            )

        # Defense-in-depth: ApprovalDecision already rejects PENDING at
        # the schema level, so this is unreachable through the API today.
        # review_decision must never be the mechanism that returns an
        # approval to PENDING — reset_approval (Manager/Administrator
        # only) is the sole path back to PENDING.
        if payload.status == ApprovalStatus.PENDING:
            raise ValidationException(
                "PENDING is not a valid review outcome. "
                "Use PATCH /approvals/{approval_id}/reset instead."
            )

        if (
            current_user.id != approval.reviewer_id
            and current_user.role.name != "administrator"
        ):
            raise PermissionDeniedException(
                "You do not have permission to review this approval."
            )

        # A finalized Decision is closed to further approval action —
        # regardless of role. Terminal state is reached only through the
        # approval workflow itself (see DecisionService), never reopened
        # via this endpoint.
        if approval.decision.status in (
            DecisionStatus.APPROVED,
            DecisionStatus.REJECTED,
        ):
            raise ConflictException(
                "This decision has already been finalized; no further approval actions are allowed."
            )

        # Sequential enforcement: every assigned level below this one must
        # already be APPROVED. Levels that were never assigned are simply
        # absent from this list, so they impose no requirement.
        decision_approvals = await self.approvals.list_by_decision(
            approval.decision_id
        )

        blocking_level = next(
            (
                a for a in decision_approvals
                if a.level < approval.level and a.status != ApprovalStatus.APPROVED
            ),
            None,
        )

        if blocking_level is not None:
            raise ConflictException(
                f"Level {approval.level} cannot be reviewed until level "
                f"{blocking_level.level} is approved."
            )

        approval.status = payload.status
        approval.comments = payload.comments

        if payload.status in (
            ApprovalStatus.APPROVED,
            ApprovalStatus.REJECTED,
            ApprovalStatus.ESCALATED,
        ):
            approval.decided_at = datetime.now(timezone.utc)

        decision_title = approval.decision.title
        decision_creator_id = approval.decision.created_by_id

        changed_decision = await self._sync_decision_status(
            decision_id=approval.decision_id,
            changed_by_id=current_user.id,
        )

        await self.db.commit()

        await self.audit_logs.log_safely(
            actor=current_user,
            action="approval.decided",
            entity_type="approval",
            entity_id=approval_id,
            log_metadata={"status": payload.status.value, "decision_id": str(approval.decision_id)},
        )

        # --- Best-effort notifications; workflow state above is already
        # committed, so nothing here can roll it back. ---

        await self._notify_safely(
            recipient_id=decision_creator_id,
            notification_type=NotificationType.APPROVAL_DECISION,
            title="Approval decision recorded",
            message=(
                f'Level {approval.level} was {payload.status.value} '
                f'for "{decision_title}".'
            ),
            related_entity_type="approval",
            related_entity_id=approval.id,
        )

        if payload.status == ApprovalStatus.ESCALATED:
            recipient_ids = await self._resolve_escalation_recipients(
                approval.decision_id
            )

            for recipient_id in recipient_ids:
                await self._notify_safely(
                    recipient_id=recipient_id,
                    notification_type=NotificationType.ESCALATION,
                    title="Approval escalated",
                    message=(
                        f'Level {approval.level} review of "{decision_title}" '
                        f"has been escalated and needs attention."
                    ),
                    related_entity_type="approval",
                    related_entity_id=approval.id,
                )

        if changed_decision is not None:
            await self._notify_safely(
                recipient_id=changed_decision.created_by_id,
                notification_type=NotificationType.DECISION_STATUS_CHANGE,
                title="Decision status changed",
                message=(
                    f'"{changed_decision.title}" status changed to '
                    f"{changed_decision.status.value}."
                ),
                related_entity_type="decision",
                related_entity_id=changed_decision.id,
            )

        updated = await self.approvals.get_by_id(
            approval_id
        )

        return ApprovalOut.model_validate(
            updated
        )

    # --------------------------------------------------
    # Reset
    # --------------------------------------------------

    async def reset_approval(
        self,
        approval_id: uuid.UUID,
        current_user: User,
    ) -> ApprovalOut:

        approval = await self.approvals.get_by_id(
            approval_id
        )

        if approval is None:
            raise NotFoundException(
                "Approval not found."
            )

        approval.status = ApprovalStatus.PENDING
        approval.comments = None
        approval.decided_at = None

        decision_title = approval.decision.title

        # Resetting an approval can undo the very fact that made the
        # parent Decision terminal (e.g. undoing a rejection) — recompute
        # so Decision.status never lags behind the approvals that justify
        # it.
        changed_decision = await self._sync_decision_status(
            decision_id=approval.decision_id,
            changed_by_id=current_user.id,
        )

        await self.db.commit()

        # --- Best-effort notifications; workflow state above is already
        # committed, so nothing here can roll it back. ---

        await self._notify_safely(
            recipient_id=approval.reviewer_id,
            notification_type=NotificationType.APPROVAL_REQUEST,
            title="Review reopened",
            message=(
                f'Your review of "{decision_title}" at level {approval.level} '
                f"has been reset and requires action again."
            ),
            related_entity_type="approval",
            related_entity_id=approval.id,
        )

        if changed_decision is not None:
            await self._notify_safely(
                recipient_id=changed_decision.created_by_id,
                notification_type=NotificationType.DECISION_STATUS_CHANGE,
                title="Decision status changed",
                message=(
                    f'"{changed_decision.title}" status changed to '
                    f"{changed_decision.status.value}."
                ),
                related_entity_type="decision",
                related_entity_id=changed_decision.id,
            )

        updated = await self.approvals.get_by_id(
            approval_id
        )

        return ApprovalOut.model_validate(
            updated
        )

    # --------------------------------------------------
    # Delete
    # --------------------------------------------------

    async def remove_assignment(
        self,
        approval_id: uuid.UUID,
    ) -> None:

        raise NotImplementedError(
            "Approval assignments are immutable and cannot be deleted."
        )
        
        approval = await self.approvals.get_by_id(
            approval_id
        )

        if approval is None:
            raise NotFoundException(
                "Approval not found."
            )

        await self.approvals.hard_delete(
            approval
        )

        await self.db.commit()
