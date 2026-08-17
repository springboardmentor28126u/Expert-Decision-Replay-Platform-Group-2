# services/task_routing_service.py
"""
services/task_routing_service.py

Natural-language "task routing" for Managers/Administrators:
"reassign decision <id> to reviewer <name/id>" or "escalate decision
<id>". The LLM's job stops at turning that sentence into one of two
fixed structured actions — it never touches the database, never
generates SQL, and never decides anything on its own. Every mutation
that actually happens runs through the *existing*
ApprovalService.assign_reviewer() / ApprovalService.review_decision()
— the same code paths the manual "Assign Reviewer" UI and manual
approve/reject/escalate UI already use. This service adds nothing new
at the mutation layer; it only adds interpretation, a stricter
reviewer-eligibility check on top of what assign_reviewer already
enforces, and an additional audit trail entry marking the action as
AI-initiated.

Two-phase flow, both phases running the exact same validation:

  1. interpret (confirm=False): command -> LLM -> strict Pydantic-
     validated structured action -> full validation against the real
     data -> a preview response. Nothing is mutated here, ever.
  2. execute (confirm=True): the caller echoes back the exact action/
     decision_id/reviewer_id the preview returned. The LLM is NOT
     re-invoked (that would risk a different interpretation the second
     time around) — instead the same validation function runs again
     against current data (a race between preview and confirm is still
     caught), and only then is the real service method called.

Nothing here is trusted from the model or the client without being
re-checked against the database: decision existence, decision state,
reviewer existence/active status/role, self-review, and duplicate
assignment are all re-verified at confirm time regardless of what was
shown in the preview.
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from dataclasses import dataclass
from typing import Optional

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.approval import Approval
from app.models.decision import Decision
from app.models.enums import ApprovalStatus, DecisionStatus, RoleName
from app.models.user import User
from app.repositories.approval_repository import ApprovalRepository
from app.repositories.decision_repository import DecisionRepository
from app.repositories.user_repository import UserRepository
from app.schemas.approval import ApprovalAssign, ApprovalDecision
from app.schemas.task_routing import TaskRoutingRequest, TaskRoutingResponse
from app.services import llm_client
from app.services.approval_service import ApprovalService
from app.services.audit_log_service import AuditLogService
from app.utils.exceptions import NotFoundException

logger = logging.getLogger("edrp.task_routing")

# The only two mutation-capable actions the LLM's output can ever
# resolve to. "unsupported" and "unclear" are terminal, non-mutating
# outcomes — see _parse_command.
_SUPPORTED_ACTIONS = {"reassign_reviewer", "escalate"}

# Any reviewer target below the manager level is never eligible,
# mirroring the caveat in the task spec: reviewer/manager only, never
# employee, never administrator — there is no existing workflow
# precedent for either of those as an approval reviewer.
_ELIGIBLE_REVIEWER_ROLES_BY_LEVEL = {
    1: {RoleName.REVIEWER.value},
    "default": {RoleName.REVIEWER.value, RoleName.MANAGER.value},
}

_UNAVAILABLE_MESSAGE = (
    "AI task routing is temporarily unavailable. Please try again in a "
    "minute, or use the manual reviewer assignment / escalation controls."
)
_UNCLEAR_MESSAGE = (
    'Could not confidently understand that command. Try something like '
    '"Reassign decision <decision id> to reviewer <name>" or '
    '"Escalate decision <decision id>".'
)
_UNSUPPORTED_MESSAGE = (
    "AI task routing only supports reassigning a reviewer or escalating "
    "a decision's current review step. No other action was taken."
)


class _TaskValidationError(Exception):
    """
    Internal only — never propagates past this service. Represents an
    expected business-rule rejection (wrong role, duplicate, self-
    review, invalid state, etc). Decision-not-found is NOT represented
    here; that raises NotFoundException directly, matching every other
    decision lookup in this codebase.
    """

    def __init__(self, message: str) -> None:
        self.message = message


@dataclass
class _ValidatedReassign:
    decision: Decision
    reviewer: User
    level: int


@dataclass
class _ValidatedEscalate:
    decision: Decision
    approval: Approval


class TaskRoutingService:

    def __init__(
        self,
        db: AsyncSession,
        background_tasks: BackgroundTasks | None = None,
    ) -> None:
        self.db = db
        self.decisions = DecisionRepository(db)
        self.approvals = ApprovalRepository(db)
        self.users = UserRepository(db)
        self.audit_logs = AuditLogService(db)
        # The one and only place a mutation actually happens — the same
        # service the manual assign/review/escalate UI already calls.
        self.approval_service = ApprovalService(db, background_tasks)

    async def route(
        self,
        payload: TaskRoutingRequest,
        current_user: User,
    ) -> TaskRoutingResponse:

        if payload.confirm:
            return await self._execute(payload, current_user)

        return await self._interpret(payload.command, current_user)

    # --------------------------------------------------
    # Phase 1 — interpret (never mutates)
    # --------------------------------------------------

    async def _interpret(
        self,
        command: str,
        current_user: User,
    ) -> TaskRoutingResponse:

        candidates = await self._reviewer_candidates()
        prompt = self._build_prompt(command, candidates)

        raw_text, provider = await llm_client.generate_text_with_provider(prompt)

        if raw_text is None or provider is None:
            return TaskRoutingResponse(
                success=False,
                executed=False,
                message=_UNAVAILABLE_MESSAGE,
            )

        parsed = self._parse_command(raw_text)

        if parsed is None:
            return TaskRoutingResponse(
                success=False,
                executed=False,
                generated_by=provider,
                message=_UNCLEAR_MESSAGE,
            )

        action, decision_id, reviewer_id = parsed

        if action == "unsupported":
            return TaskRoutingResponse(
                success=False,
                executed=False,
                action="unsupported",
                generated_by=provider,
                message=_UNSUPPORTED_MESSAGE,
            )

        if action == "unclear" or decision_id is None or (action == "reassign_reviewer" and reviewer_id is None):
            return TaskRoutingResponse(
                success=False,
                executed=False,
                action="unclear",
                generated_by=provider,
                message=_UNCLEAR_MESSAGE,
            )

        # Decision-not-found is a real 404, matching every other
        # decision lookup endpoint — it propagates out of this method.
        try:
            if action == "reassign_reviewer":
                validated = await self._validate_reassign(decision_id, reviewer_id, current_user)
                return TaskRoutingResponse(
                    success=True,
                    executed=False,
                    action="reassign_reviewer",
                    decision_id=validated.decision.id,
                    decision_title=validated.decision.title,
                    reviewer_id=validated.reviewer.id,
                    reviewer_name=validated.reviewer.full_name,
                    generated_by=provider,
                    message=(
                        f'AI interpreted this as: reassign "{validated.decision.title}" '
                        f"(level {validated.level}) to {validated.reviewer.full_name} "
                        f"({validated.reviewer.role.name}). Confirm to proceed — nothing "
                        "has been changed yet."
                    ),
                )

            validated_escalate = await self._validate_escalate(decision_id, current_user)
            return TaskRoutingResponse(
                success=True,
                executed=False,
                action="escalate",
                decision_id=validated_escalate.decision.id,
                decision_title=validated_escalate.decision.title,
                generated_by=provider,
                message=(
                    f'AI interpreted this as: escalate "{validated_escalate.decision.title}" '
                    f"(level {validated_escalate.approval.level}). Confirm to proceed — "
                    "nothing has been changed yet."
                ),
            )

        except _TaskValidationError as exc:
            return TaskRoutingResponse(
                success=False,
                executed=False,
                action=action,
                decision_id=decision_id,
                reviewer_id=reviewer_id,
                generated_by=provider,
                message=exc.message,
            )

    # --------------------------------------------------
    # Phase 2 — execute (only path that can mutate anything)
    # --------------------------------------------------

    async def _execute(
        self,
        payload: TaskRoutingRequest,
        current_user: User,
    ) -> TaskRoutingResponse:

        if payload.action not in _SUPPORTED_ACTIONS or payload.decision_id is None:
            return TaskRoutingResponse(
                success=False,
                executed=False,
                message="Nothing to confirm — please interpret a command first.",
            )

        if payload.action == "reassign_reviewer" and payload.reviewer_id is None:
            return TaskRoutingResponse(
                success=False,
                executed=False,
                action="reassign_reviewer",
                decision_id=payload.decision_id,
                message="Nothing to confirm — please interpret a command first.",
            )

        try:
            if payload.action == "reassign_reviewer":
                validated = await self._validate_reassign(
                    payload.decision_id, payload.reviewer_id, current_user
                )

                await self.approval_service.assign_reviewer(
                    validated.decision.id,
                    ApprovalAssign(reviewer_id=validated.reviewer.id, level=validated.level),
                )

                await self.audit_logs.log_safely(
                    actor=current_user,
                    action="ai.task_routed",
                    entity_type="decision",
                    entity_id=validated.decision.id,
                    log_metadata={
                        "command": payload.command,
                        "requested_action": "reassign_reviewer",
                        "decision_id": str(validated.decision.id),
                        "reviewer_id": str(validated.reviewer.id),
                        "level": validated.level,
                        "initiated_by": str(current_user.id),
                        "provider": payload.generated_by,
                    },
                )

                return TaskRoutingResponse(
                    success=True,
                    executed=True,
                    action="reassign_reviewer",
                    decision_id=validated.decision.id,
                    decision_title=validated.decision.title,
                    reviewer_id=validated.reviewer.id,
                    reviewer_name=validated.reviewer.full_name,
                    generated_by=payload.generated_by,
                    message=(
                        f'"{validated.decision.title}" reassigned to '
                        f"{validated.reviewer.full_name} at level {validated.level}."
                    ),
                )

            validated_escalate = await self._validate_escalate(payload.decision_id, current_user)

            await self.approval_service.review_decision(
                validated_escalate.approval.id,
                ApprovalDecision(status=ApprovalStatus.ESCALATED, comments="Escalated via AI Task Routing."),
                current_user,
            )

            await self.audit_logs.log_safely(
                actor=current_user,
                action="ai.task_routed",
                entity_type="decision",
                entity_id=validated_escalate.decision.id,
                log_metadata={
                    "command": payload.command,
                    "requested_action": "escalate",
                    "decision_id": str(validated_escalate.decision.id),
                    "reviewer_id": None,
                    "approval_id": str(validated_escalate.approval.id),
                    "level": validated_escalate.approval.level,
                    "initiated_by": str(current_user.id),
                    "provider": payload.generated_by,
                },
            )

            return TaskRoutingResponse(
                success=True,
                executed=True,
                action="escalate",
                decision_id=validated_escalate.decision.id,
                decision_title=validated_escalate.decision.title,
                generated_by=payload.generated_by,
                message=(
                    f'"{validated_escalate.decision.title}" escalated at '
                    f"level {validated_escalate.approval.level}."
                ),
            )

        except _TaskValidationError as exc:
            return TaskRoutingResponse(
                success=False,
                executed=False,
                action=payload.action,
                decision_id=payload.decision_id,
                reviewer_id=payload.reviewer_id,
                generated_by=payload.generated_by,
                message=exc.message,
            )

    # --------------------------------------------------
    # Validation — shared by both phases, never mutates
    # --------------------------------------------------

    async def _validate_reassign(
        self,
        decision_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        current_user: User,
    ) -> _ValidatedReassign:

        decision = await self.decisions.get_by_id(decision_id)
        if decision is None:
            raise NotFoundException("Decision not found.")

        if decision.status in (DecisionStatus.APPROVED, DecisionStatus.REJECTED):
            raise _TaskValidationError(
                "This decision has already been finalized; no further approval actions are allowed."
            )

        reviewer = await self.users.get_by_id(reviewer_id)
        if reviewer is None:
            raise _TaskValidationError("Reviewer not found.")

        if not reviewer.is_active:
            raise _TaskValidationError(
                f"{reviewer.full_name} is not an active user and cannot be assigned as a reviewer."
            )

        if reviewer.id == decision.created_by_id:
            raise _TaskValidationError(
                "The decision's creator cannot be assigned as their own reviewer."
            )

        level = await self._resolve_target_level(decision.id)

        eligible_roles = _ELIGIBLE_REVIEWER_ROLES_BY_LEVEL.get(
            level, _ELIGIBLE_REVIEWER_ROLES_BY_LEVEL["default"]
        )
        if reviewer.role.name not in eligible_roles:
            raise _TaskValidationError(
                f"{reviewer.full_name} has the {reviewer.role.name} role and is not "
                f"eligible to be assigned as the level {level} reviewer. Eligible "
                f"roles at this level: {', '.join(sorted(eligible_roles))}."
            )

        existing = await self.approvals.find_assignment(decision.id, reviewer.id, level)
        if existing is not None:
            raise _TaskValidationError(
                f"{reviewer.full_name} is already assigned at level {level} for this decision."
            )

        return _ValidatedReassign(decision=decision, reviewer=reviewer, level=level)

    async def _validate_escalate(
        self,
        decision_id: uuid.UUID,
        current_user: User,
    ) -> _ValidatedEscalate:

        decision = await self.decisions.get_by_id(decision_id)
        if decision is None:
            raise NotFoundException("Decision not found.")

        if decision.status in (DecisionStatus.APPROVED, DecisionStatus.REJECTED):
            raise _TaskValidationError(
                "This decision has already been finalized; no further approval actions are allowed."
            )

        approval = await self._active_pending_approval(decision.id)
        if approval is None:
            raise _TaskValidationError(
                "There is no pending review step to escalate for this decision."
            )

        if current_user.id != approval.reviewer_id and current_user.role.name != RoleName.ADMINISTRATOR.value:
            raise _TaskValidationError(
                "Only the reviewer currently assigned to this decision, or an "
                "administrator, can escalate its review."
            )

        return _ValidatedEscalate(decision=decision, approval=approval)

    async def _resolve_target_level(self, decision_id: uuid.UUID) -> int:
        """
        The level a reassignment targets: the lowest-level PENDING
        approval (the "current" reviewer being replaced), or level 1 if
        the decision has no pending approval yet (first assignment).
        """
        approval = await self._active_pending_approval(decision_id)
        return approval.level if approval is not None else 1

    async def _active_pending_approval(self, decision_id: uuid.UUID) -> Optional[Approval]:
        approvals = await self.approvals.list_by_decision(decision_id)
        pending = [a for a in approvals if a.status == ApprovalStatus.PENDING]
        if not pending:
            return None
        return min(pending, key=lambda a: a.level)

    # --------------------------------------------------
    # LLM interpretation
    # --------------------------------------------------

    async def _reviewer_candidates(self) -> list[User]:
        """
        Only reviewers and managers are ever shown to the model as
        possible reassignment targets — employees and administrators
        are structurally never in the list the model can match a name
        against, on top of the explicit role check in
        _validate_reassign.
        """
        reviewers = await self.users.list_active_by_role_name(RoleName.REVIEWER.value)
        managers = await self.users.list_active_by_role_name(RoleName.MANAGER.value)
        return [*reviewers, *managers]

    @staticmethod
    def _build_prompt(command: str, candidates: list[User]) -> str:
        roster_text = "\n".join(
            f"- id: {u.id}, name: {u.full_name}, role: {u.role.name}" for u in candidates
        ) or "No active reviewers or managers are currently registered."

        return (
            "You are a strict command interpreter for a decision-approval "
            "system. You ONLY extract structured intent — you never execute "
            "anything yourself, and nothing you output is applied automatically.\n\n"
            "Exactly two actions are supported:\n"
            '- "reassign_reviewer": assign or reassign the reviewer for a decision\n'
            '- "escalate": escalate a decision\'s current pending review\n\n'
            "Any other request — deleting or listing records, changing a "
            "user's role or permissions, approving or rejecting a decision "
            "directly, running or generating SQL, or anything not listed "
            'above — must be classified as "unsupported".\n\n'
            'If the command is ambiguous, is missing a decision id, or you '
            "cannot confidently match a reviewer name to exactly one person "
            'in the roster below, classify it as "unclear".\n\n'
            "Known reviewers/managers you may match a name against — use "
            "their id EXACTLY as written below, never invent one:\n"
            f"{roster_text}\n\n"
            "The command may reference a decision by its id (a UUID). "
            "Extract it EXACTLY as written in the command — never invent or "
            "guess one; if no id-looking value is present, use null.\n\n"
            "Reply with ONLY compact JSON, no markdown, no explanation, in "
            "exactly this shape:\n"
            '{"action": "reassign_reviewer" | "escalate" | "unsupported" | '
            '"unclear", "decision_id": "<uuid or null>", "reviewer_id": '
            '"<uuid from the roster above or null>"}\n\n'
            f"Command: {command}\n\n"
            "JSON:"
        )

    @staticmethod
    def _parse_command(
        raw_text: str,
    ) -> Optional[tuple[str, Optional[uuid.UUID], Optional[uuid.UUID]]]:
        """
        Best-effort, defense-in-depth parse. Never raises. Anything that
        doesn't cleanly decode into the exact expected shape — bad JSON,
        an action outside the four known literals, a malformed UUID —
        is treated as unparseable, which the caller turns into a
        no-mutation "unclear" response. This is also the structural
        reason the model can never reach the mutation layer with
        anything other than "reassign_reviewer" or "escalate": those
        are the only two values _SUPPORTED_ACTIONS recognizes, and every
        other string here already collapses to "unsupported"/"unclear"
        before validation even starts.
        """
        cleaned = raw_text.strip()
        cleaned = re.sub(r"^```(?:json)?|```$", "", cleaned, flags=re.MULTILINE).strip()

        try:
            data = json.loads(cleaned)
        except (json.JSONDecodeError, TypeError):
            return None

        if not isinstance(data, dict):
            return None

        action = data.get("action")
        if action not in ("reassign_reviewer", "escalate", "unsupported", "unclear"):
            return None

        def _as_uuid(value) -> Optional[uuid.UUID]:
            if not value or not isinstance(value, str):
                return None
            try:
                return uuid.UUID(value)
            except ValueError:
                return None

        decision_id = _as_uuid(data.get("decision_id"))
        reviewer_id = _as_uuid(data.get("reviewer_id"))

        return action, decision_id, reviewer_id
