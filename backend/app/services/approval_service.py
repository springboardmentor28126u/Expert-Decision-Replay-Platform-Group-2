"""
services/approval_service.py

Business logic for approval workflow.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import BackgroundTasks
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

from app.services import email_service
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
        background_tasks: BackgroundTasks | None = None,
    ) -> None:

        self.db = db
        self.background_tasks = background_tasks

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
        decision_id: uuid.UUID,
        decision_title: str,
    ) -> None:
        """
        Notification delivery is best-effort: a failure here must never
        surface to the caller or undo an already-committed approval/
        decision state change. Called only after the workflow's own
        commit has already succeeded, so there is nothing to roll back —
        a failure here only affects the notification row itself.

        Also queues the same event as a background email (if configured)
        via the same title/message the in-app notification uses, so the
        two never drift apart. Email delivery failures are isolated in
        email_service and can't affect this method or its caller.
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

        if self.background_tasks is None:
            return

        try:
            recipient = await self.users.get_by_id(recipient_id)
            if recipient is not None and recipient.email:
                email_service.queue_email(
                    self.background_tasks,
                    to_email=recipient.email,
                    heading=title,
                    message=message,
                    decision_title=decision_title,
                    decision_id=decision_id,
                )
        except Exception:
            logger.exception(
                "Failed to queue email (recipient=%s, decision=%s); "
                "in-app notification is unaffected.",
                recipient_id,
                decision_id,
            )

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

        # Level 1 is the entry point of the approval chain — enforcing the
        # role here (rather than for every level) keeps level 3+ free for
        # administrators to assign at their discretion, per the workflow's
        # existing "manual from level 3 up" design.
        if payload.level == 1 and reviewer.role.name != RoleName.REVIEWER.value:
            raise ValidationException(
                "Level 1 reviewer must be a user with the reviewer role."
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
            decision_id=decision.id,
            decision_title=decision.title,
            related_entity_type="approval",
            related_entity_id=approval.id,
        )

        # A valid level-1 assignment is the trigger for auto-assigning the
        # decision creator's team manager at level 2 — see
        # _maybe_auto_assign_level_2 for the full set of conditions. This
        # never runs for level 2+ assignments themselves, so manually
        # assigning/reassigning level 2 (or level 3+) behaves exactly as
        # before.
        if payload.level == 1:
            await self._maybe_auto_assign_level_2(decision)

        created = await self.approvals.get_by_id(
            approval.id
        )

        return ApprovalOut.model_validate(
            created
        )

    async def _maybe_auto_assign_level_2(
        self,
        decision: Decision,
    ) -> None:
        """
        Auto-assigns the decision creator's team manager as the level-2
        reviewer, once a level-1 (reviewer-role) assignment exists.
        Silently no-ops — this is a convenience, not a requirement, so a
        decision missing any of these preconditions simply has no level-2
        reviewer auto-assigned; a Manager/Administrator can still assign
        one manually via the normal endpoint.

        Conditions, all of which must hold:
          - the creator holds the employee role
          - the creator belongs to a team (User.team_id is set)
          - that team has a manager (Team.manager_id is set)
          - the manager isn't the creator themselves (no self-review)
          - no level-2 approval already exists for this decision (manual
            or from a prior call of this method — never double-assign)
        """

        creator = await self.users.get_by_id(
            decision.created_by_id
        )

        if creator is None or creator.role.name != RoleName.EMPLOYEE.value:
            return

        if creator.team is None:
            return

        manager_id = creator.team.manager_id

        if manager_id is None:
            return

        if manager_id == decision.created_by_id:
            return

        decision_approvals = await self.approvals.list_by_decision(
            decision.id
        )

        if any(a.level == 2 for a in decision_approvals):
            return

        manager = await self.users.get_by_id(
            manager_id
        )

        if manager is None:
            return

        approval = Approval(
            decision_id=decision.id,
            reviewer_id=manager_id,
            level=2,
            status=ApprovalStatus.PENDING,
        )

        self.approvals.add(
            approval
        )

        await self.db.commit()

        # System-triggered, not a user action — no actor to attribute it to.
        await self.audit_logs.log_safely(
            actor=None,
            action="approval.auto_assigned",
            entity_type="approval",
            entity_id=approval.id,
            log_metadata={
                "decision_id": str(decision.id),
                "level": 2,
                "reviewer_id": str(manager_id),
                "reason": "team_manager_auto_assignment",
            },
        )

        await self._notify_safely(
            recipient_id=manager_id,
            notification_type=NotificationType.APPROVAL_REQUEST,
            title="New review assignment",
            message=(
                f'You have been assigned to review "{decision.title}" '
                f"at level 2, as manager of the team that created it."
            ),
            decision_id=decision.id,
            decision_title=decision.title,
            related_entity_type="approval",
            related_entity_id=approval.id,
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
            decision_id=approval.decision_id,
            decision_title=decision_title,
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
                    decision_id=approval.decision_id,
                    decision_title=decision_title,
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
                decision_id=changed_decision.id,
                decision_title=changed_decision.title,
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
            decision_id=approval.decision_id,
            decision_title=decision_title,
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
                decision_id=changed_decision.id,
                decision_title=changed_decision.title,
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
