"""
Expert Decision Replay Platform - Decision Service

Business logic for decision management CRUD and lifecycle.
"""

from typing import Dict, Set, List, Tuple, Optional
from uuid import UUID
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models.decision import Decision, DecisionStatus, ImpactLevel
from app.models.decision_category import DecisionCategory
from app.schemas.decision import DecisionCreate, DecisionUpdate
from app.models.alternative import Alternative
from app.models.approval import Approval, ApprovalStatus
from app.services.version_service import VersionService
from app.services.audit_service import AuditService
from app.services.workflow import transition_guard, log_audit_event
from app.models.approval_chain import ApprovalChainConfig
from app.models.group import Group
from app.models.group_membership import GroupMembership
from app.models.membership import Membership, CompanyRole
from app.api.deps import can_access_decision
from app.models.user import User, UserRole


class DecisionService:
    """Service for decision lifecycle management in a multi-tenant hierarchy."""

    # ------------------------------------------------------------------ #
    #  CREATE                                                              #
    # ------------------------------------------------------------------ #
    @staticmethod
    def create(db: Session, data: DecisionCreate, user_id: UUID, company_id: UUID) -> Decision:
        """Create a new decision in DRAFT status associated with a company and group."""
        # Validate category exists
        category = db.query(DecisionCategory).filter(DecisionCategory.id == data.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category_id",
            )

        # Validate group exists and belongs to company
        group = (
            db.query(Group)
            .filter(Group.id == data.group_id, Group.company_id == company_id)
            .first()
        )
        if not group:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid group_id for this company",
            )

        # Check access to group
        membership = (
            db.query(Membership)
            .filter(Membership.user_id == user_id, Membership.company_id == company_id)
            .first()
        )
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this company")

        gm = (
            db.query(GroupMembership)
            .filter(
                GroupMembership.group_id == data.group_id,
                GroupMembership.user_id == user_id,
                GroupMembership.is_active == True,  # noqa: E712
            )
            .first()
        )
        if not gm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create a decision in a group you have not joined",
            )

        # Validate impact level
        impact = ImpactLevel.MEDIUM
        if data.impact_level:
            try:
                impact = ImpactLevel(data.impact_level)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid impact_level '{data.impact_level}'. Must be one of: low, medium, high",
                )

        # Validate stakeholders exist if provided
        if data.stakeholder_ids:
            existing_users = (
                db.query(User.id)
                .filter(User.id.in_(data.stakeholder_ids))
                .all()
            )
            existing_ids = {u[0] for u in existing_users}
            missing = [str(sid) for sid in data.stakeholder_ids if sid not in existing_ids]
            if missing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stakeholder(s) not found: {', '.join(missing)}",
                )

        decision = Decision(
            company_id=company_id,
            group_id=data.group_id,
            title=data.title,
            problem_statement=data.problem_statement,
            category_id=data.category_id,
            impact_level=impact,
            target_date=data.target_date,
            stakeholder_ids=[str(sid) for sid in (data.stakeholder_ids or [])],
            created_by=user_id,
            status=DecisionStatus.DRAFT,
            current_version=1,
        )
        db.add(decision)
        db.flush()

        # Create initial version snapshot (v1)
        VersionService.create_snapshot(
            db, decision, user_id, change_summary="Initial draft created"
        )

        db.commit()
        db.refresh(decision)
        return decision

    # ------------------------------------------------------------------ #
    #  READ (single)                                                       #
    # ------------------------------------------------------------------ #
    @staticmethod
    def get_by_id(db: Session, decision_id: UUID, current_user: User) -> Decision:
        """Get a decision by ID with server-side hierarchical access control."""
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Decision not found",
            )

        # Enforce access rule: Admin of company OR GroupMember of group
        can_access_decision(current_user, decision, db)
        return decision

    # ------------------------------------------------------------------ #
    #  READ (list)                                                         #
    # ------------------------------------------------------------------ #
    @staticmethod
    def list_decisions(
        db: Session,
        current_user: User,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
        status_filter: Optional[str] = None,
        category_id: Optional[UUID] = None,
        search: Optional[str] = None,
        my_only: bool = False,
        pending_for_me: bool = False,
    ) -> Tuple[List[Decision], int]:
        """
        List decisions scoped strictly to company_id and group memberships.

        - EVERY query MUST filter by company_id (tenancy boundary).
        - Admin: sees all decisions in company_id.
        - Manager / Employee: sees decisions in groups they are a member of via GroupMembership.
        """
        mem = (
            db.query(Membership)
            .filter(Membership.user_id == current_user.id, Membership.company_id == company_id)
            .first()
        )
        if not mem:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this company",
            )

        query = db.query(Decision).filter(Decision.company_id == company_id)

        if my_only:
            query = query.filter(Decision.created_by == current_user.id)

        if mem.role != CompanyRole.ADMIN:
            # Filter by groups where current_user has a GroupMembership
            user_group_ids = (
                db.query(GroupMembership.group_id)
                .filter(
                    GroupMembership.user_id == current_user.id,
                    GroupMembership.is_active == True,  # noqa: E712
                )
                .subquery()
            )
            query = query.filter(Decision.group_id.in_(user_group_ids))

        if pending_for_me:
            query = query.filter(
                Decision.status == DecisionStatus.UNDER_REVIEW,
                Decision.approvals.any(
                    and_(
                        Approval.status == ApprovalStatus.PENDING,
                        Approval.approver_id == current_user.id,
                    ),
                ),
            )

        # Apply optional filters
        if status_filter:
            try:
                ds = DecisionStatus(status_filter)
                query = query.filter(Decision.status == ds)
            except ValueError:
                pass

        if category_id:
            query = query.filter(Decision.category_id == category_id)

        if search:
            term = f"%{search}%"
            query = query.filter(
                (Decision.title.ilike(term))
                | (Decision.problem_statement.ilike(term))
            )

        total = query.count()
        decisions = (
            query.order_by(Decision.updated_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return decisions, total

    # ------------------------------------------------------------------ #
    #  UPDATE                                                              #
    # ------------------------------------------------------------------ #
    @staticmethod
    def update(
        db: Session, decision_id: UUID, data: DecisionUpdate, current_user: User
    ) -> Decision:
        """Update a draft decision."""
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found"
            )

        can_access_decision(current_user, decision, db)

        if decision.status != DecisionStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft decisions can be edited. Submit a revision instead.",
            )

        update_data = data.model_dump(exclude_unset=True)

        if "impact_level" in update_data and update_data["impact_level"] is not None:
            try:
                update_data["impact_level"] = ImpactLevel(update_data["impact_level"])
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid impact_level '{update_data['impact_level']}'. Must be one of: low, medium, high",
                )

        if "category_id" in update_data and update_data["category_id"] is not None:
            cat = db.query(DecisionCategory).filter(
                DecisionCategory.id == update_data["category_id"]
            ).first()
            if not cat:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid category_id",
                )

        if "group_id" in update_data and update_data["group_id"] is not None:
            grp = (
                db.query(Group)
                .filter(Group.id == update_data["group_id"], Group.company_id == decision.company_id)
                .first()
            )
            if not grp:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid group_id for this company",
                )
            gm = db.query(GroupMembership).filter(
                GroupMembership.group_id == update_data["group_id"],
                GroupMembership.user_id == current_user.id,
                GroupMembership.is_active == True,  # noqa: E712
            ).first()
            if not gm:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not an active member of the target group",
                )

        if "stakeholder_ids" in update_data and update_data["stakeholder_ids"] is not None:
            update_data["stakeholder_ids"] = [
                str(sid) for sid in update_data["stakeholder_ids"]
            ]

        # Snapshot the pre-edit state before mutating
        old_snapshot = {"title": decision.title, "problem_statement": decision.problem_statement}
        VersionService.create_snapshot(
            db, decision, current_user.id, change_summary="Draft edited"
        )

        for key, value in update_data.items():
            setattr(decision, key, value)

        AuditService.log(
            db,
            entity_type="decision",
            entity_id=decision.id,
            action="edit",
            performed_by=current_user.id,
            old_value=old_snapshot,
            new_value={k: str(v) if not isinstance(v, (str, int, float, bool, type(None), list)) else v for k, v in update_data.items()},
        )

        db.commit()
        db.refresh(decision)
        return decision

    # ------------------------------------------------------------------ #
    #  UPDATE IMPLEMENTATION STATUS                                         #
    # ------------------------------------------------------------------ #
    @staticmethod
    def update_implementation_status(
        db: Session, decision_id: UUID, new_status: str, current_user: User
    ) -> Decision:
        """Update post-approval implementation_status (not_started -> in_progress -> completed)."""
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found")

        can_access_decision(current_user, decision, db)

        if decision.status != DecisionStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Implementation status can only be updated for approved decisions.",
            )

        from app.models.decision import ImplementationStatus
        try:
            parsed = ImplementationStatus(new_status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid implementation_status: {new_status}",
            )

        # Sequential enforcement
        allowed_next = {
            ImplementationStatus.NOT_STARTED: ImplementationStatus.IN_PROGRESS,
            ImplementationStatus.IN_PROGRESS: ImplementationStatus.COMPLETED,
        }
        expected = allowed_next.get(decision.implementation_status)
        if expected is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Implementation already completed (current: {decision.implementation_status.value}).",
            )
        if parsed != expected:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot transition from {decision.implementation_status.value} to {parsed.value}. Expected: {expected.value}",
            )

        old_status = decision.implementation_status.value
        decision.implementation_status = parsed

        AuditService.log(
            db,
            entity_type="decision",
            entity_id=decision.id,
            action="implementation_status_change",
            performed_by=current_user.id,
            old_value={"implementation_status": old_status},
            new_value={"implementation_status": new_status},
        )

        db.commit()
        db.refresh(decision)
        return decision

    # ------------------------------------------------------------------ #
    #  SUBMIT FOR REVIEW                                                   #
    # ------------------------------------------------------------------ #
    @staticmethod
    def submit(db: Session, decision_id: UUID, current_user: User) -> Decision:
        """Submit a decision for review."""
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found"
            )

        can_access_decision(current_user, decision, db)

        if decision.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the decision creator can submit for review",
            )

        if decision.status not in (DecisionStatus.DRAFT, DecisionStatus.REJECTED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot submit a decision in '{decision.status.value}' status.",
            )

        transition_guard(decision.status, DecisionStatus.UNDER_REVIEW)

        # Validate alternatives
        alt_count = (
            db.query(func.count(Alternative.id))
            .filter(Alternative.decision_id == decision_id)
            .scalar()
        )
        if alt_count < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least two alternatives are required before submission",
            )

        rec_count = (
            db.query(func.count(Alternative.id))
            .filter(
                Alternative.decision_id == decision_id,
                Alternative.is_recommended == True,  # noqa: E712
            )
            .scalar()
        )
        if rec_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one alternative must be marked as recommended",
            )

        # Generate approvals from ApprovalChainConfig
        chain_config = db.query(ApprovalChainConfig).filter(
            ApprovalChainConfig.category_id == decision.category_id
        ).first()

        if not chain_config or not chain_config.roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No approval chain configured for this category."
            )

        # Build map of existing approvals by level — merge manual assignments with chain
        existing_by_level = {
            a.level: a
            for a in (db.query(Approval).filter(Approval.decision_id == decision_id).all())
        }

        for level, role_str in enumerate(chain_config.roles, start=1):
            existing = existing_by_level.get(level)

            if existing and existing.status == ApprovalStatus.PENDING:
                # Keep manually-assigned approval (don't supersede, don't re-assign)
                existing.status = ApprovalStatus.PENDING
            else:
                # Supersede any previous-cycle approval at this level
                if existing:
                    existing.status = ApprovalStatus.SUPERSEDED
                    existing.acted_at = datetime.now(timezone.utc)

                # Auto-assign a new approver (exclude self, deterministic order)
                approver = (
                    db.query(User)
                    .join(Membership, User.id == Membership.user_id)
                    .join(GroupMembership, GroupMembership.user_id == User.id)
                    .filter(
                        Membership.company_id == decision.company_id,
                        GroupMembership.group_id == decision.group_id,
                        User.role == role_str,
                        User.id != current_user.id,
                    )
                    .order_by(User.created_at)
                    .first()
                )
                if not approver:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"No eligible approvers found for level {level}."
                    )

                new_approval = Approval(
                    decision_id=decision.id,
                    approver_id=approver.id,
                    level=level,
                    status=ApprovalStatus.PENDING,
                )
                db.add(new_approval)

        # Supersede any leftover approvals whose level is no longer in the chain
        chain_levels = set(range(1, len(chain_config.roles) + 1))
        for a in existing_by_level.values():
            if a.level not in chain_levels and a.status != ApprovalStatus.SUPERSEDED:
                a.status = ApprovalStatus.SUPERSEDED
                a.acted_at = datetime.now(timezone.utc)

        old_status = decision.status.value
        decision.status = DecisionStatus.UNDER_REVIEW

        VersionService.create_snapshot(
            db, decision, current_user.id, change_summary="Submitted for review"
        )

        log_audit_event(
            db,
            entity_type="decision",
            entity_id=decision.id,
            performed_by=current_user.id,
            action="submit",
            diff={"status": {"old": old_status, "new": DecisionStatus.UNDER_REVIEW.value}}
        )

        db.commit()
        db.refresh(decision)
        return decision

    # ------------------------------------------------------------------ #
    #  ARCHIVE (soft-delete)                                               #
    # ------------------------------------------------------------------ #
    @staticmethod
    def delete(db: Session, decision_id: UUID, current_user: User) -> None:
        """Archive a decision."""
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found"
            )

        can_access_decision(current_user, decision, db)

        transition_guard(decision.status, DecisionStatus.ARCHIVED)

        old_status = decision.status.value
        decision.status = DecisionStatus.ARCHIVED

        log_audit_event(
            db,
            entity_type="decision",
            entity_id=decision.id,
            performed_by=current_user.id,
            action="archive",
            diff={"status": {"old": old_status, "new": DecisionStatus.ARCHIVED.value}}
        )

        db.commit()

    # ------------------------------------------------------------------ #
    #  REVISE (REJECTED -> DRAFT)                                            #
    # ------------------------------------------------------------------ #
    @staticmethod
    def revise(db: Session, decision_id: UUID, current_user: User) -> Decision:
        """Move a REJECTED decision back to DRAFT for revision."""
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found"
            )

        can_access_decision(current_user, decision, db)

        if decision.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the decision creator can revise",
            )

        transition_guard(decision.status, DecisionStatus.DRAFT)

        # Cancel all existing approvals
        for a in db.query(Approval).filter(Approval.decision_id == decision_id).all():
            a.status = ApprovalStatus.SUPERSEDED
            a.acted_at = datetime.now(timezone.utc)

        old_status = decision.status.value
        decision.status = DecisionStatus.DRAFT

        VersionService.create_snapshot(
            db, decision, current_user.id, change_summary="Revision started"
        )

        log_audit_event(
            db,
            entity_type="decision",
            entity_id=decision.id,
            performed_by=current_user.id,
            action="revise",
            diff={"status": {"old": old_status, "new": DecisionStatus.DRAFT.value}}
        )

        db.commit()
        db.refresh(decision)
        return decision

    # ------------------------------------------------------------------ #
    #  SET OUTCOME                                                           #
    # ------------------------------------------------------------------ #
    @staticmethod
    def set_outcome(
        db: Session, decision_id: UUID, outcome: str, outcome_notes: Optional[str], current_user: User
    ) -> Decision:
        """Set the outcome for an approved decision."""
        from app.models.decision import DecisionOutcome

        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found"
            )

        can_access_decision(current_user, decision, db)

        if decision.status != DecisionStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Outcome can only be set for approved decisions",
            )

        try:
            parsed = DecisionOutcome(outcome)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid outcome '{outcome}'. Must be one of: success, partial, failed, pending",
            )

        decision.outcome = parsed
        decision.outcome_notes = outcome_notes

        AuditService.log(
            db,
            entity_type="decision",
            entity_id=decision.id,
            action="set_outcome",
            performed_by=current_user.id,
            new_value={"outcome": outcome, "outcome_notes": outcome_notes},
        )

        db.commit()
        db.refresh(decision)
        return decision

    # ------------------------------------------------------------------ #
    #  STATS                                                               #
    # ------------------------------------------------------------------ #
    @staticmethod
    def get_user_stats(db: Session, user_id: UUID, company_id: UUID) -> dict:
        """Get decision stats for a user's dashboard in a company."""
        total = (
            db.query(func.count(Decision.id))
            .filter(Decision.created_by == user_id, Decision.company_id == company_id)
            .scalar()
        )

        by_status = {}
        for s in DecisionStatus:
            count = (
                db.query(func.count(Decision.id))
                .filter(
                    Decision.created_by == user_id,
                    Decision.company_id == company_id,
                    Decision.status == s,
                )
                .scalar()
            )
            by_status[s.value] = count

        return {"total": total, "by_status": by_status}
