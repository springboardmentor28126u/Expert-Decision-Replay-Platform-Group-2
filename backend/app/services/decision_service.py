"""
Expert Decision Replay Platform - Decision Service

Business logic for decision management CRUD and lifecycle.
"""

from typing import List, Tuple, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.decision import Decision, DecisionStatus, ImpactLevel
from app.models.decision_category import DecisionCategory
from app.models.alternative import Alternative
from app.models.user import User
from app.schemas.decision import DecisionCreate, DecisionUpdate
from app.services.version_service import VersionService


class DecisionService:
    """Service for decision lifecycle management."""

    # ------------------------------------------------------------------ #
    #  CREATE                                                              #
    # ------------------------------------------------------------------ #
    @staticmethod
    def create(db: Session, data: DecisionCreate, user_id: UUID) -> Decision:
        """Create a new decision in DRAFT status and snapshot v1."""
        # Validate category exists
        category = db.query(DecisionCategory).filter(DecisionCategory.id == data.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category_id",
            )

        # Map impact level
        try:
            impact = ImpactLevel(data.impact_level)
        except ValueError:
            impact = ImpactLevel.MEDIUM

        decision = Decision(
            title=data.title,
            problem_statement=data.problem_statement,
            category_id=data.category_id,
            impact_level=impact,
            target_date=data.target_date,
            stakeholder_ids=[str(sid) for sid in (data.stakeholder_ids or [])],
            created_by=user_id,
            status=DecisionStatus.DRAFT,
            current_version=1,
            locked=False,
        )
        db.add(decision)
        db.flush()  # Get the ID before creating the snapshot

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
        """
        Get a decision by ID with access control.

        - Employees: own decisions only
        - Managers: own + team decisions
        - Admins: all
        """
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Decision not found",
            )

        role_name = current_user.role.name if current_user.role else ""

        if role_name == "Administrator":
            return decision

        if role_name == "Manager":
            # Manager can see own + team members' decisions
            if decision.created_by == current_user.id:
                return decision
            creator = db.query(User).filter(User.id == decision.created_by).first()
            if creator and creator.team_id == current_user.team_id:
                return decision
            # Also allow if decision is approved (part of knowledge repository)
            if decision.status == DecisionStatus.APPROVED:
                return decision
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this decision",
            )

        # Employee / Reviewer
        if decision.created_by == current_user.id:
            return decision
        # Allow viewing approved decisions (knowledge repository)
        if decision.status == DecisionStatus.APPROVED:
            return decision
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this decision",
        )

    # ------------------------------------------------------------------ #
    #  READ (list)                                                         #
    # ------------------------------------------------------------------ #
    @staticmethod
    def list_decisions(
        db: Session,
        current_user: User,
        skip: int = 0,
        limit: int = 20,
        status_filter: Optional[str] = None,
        category_id: Optional[UUID] = None,
        search: Optional[str] = None,
        my_only: bool = False,
    ) -> Tuple[List[Decision], int]:
        """
        List decisions with filtering, pagination, and RBAC.

        - my_only=True: only the current user's decisions
        - Employees: own decisions + approved (knowledge repository)
        - Managers: own + team + approved
        - Admins: all
        """
        query = db.query(Decision)
        role_name = current_user.role.name if current_user.role else ""

        if my_only:
            query = query.filter(Decision.created_by == current_user.id)
        elif role_name == "Administrator":
            pass  # No restriction
        elif role_name == "Manager":
            # Team decisions + approved
            team_user_ids = (
                db.query(User.id)
                .filter(User.team_id == current_user.team_id)
                .subquery()
            )
            query = query.filter(
                (Decision.created_by.in_(team_user_ids))
                | (Decision.status == DecisionStatus.APPROVED)
            )
        else:
            # Employee/Reviewer: own + approved
            query = query.filter(
                (Decision.created_by == current_user.id)
                | (Decision.status == DecisionStatus.APPROVED)
            )

        # Apply filters
        if status_filter:
            try:
                ds = DecisionStatus(status_filter)
                query = query.filter(Decision.status == ds)
            except ValueError:
                pass  # Ignore invalid status filter

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
        """Update a draft decision. Only owner or admin can edit."""
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found"
            )

        role_name = current_user.role.name if current_user.role else ""
        if decision.created_by != current_user.id and role_name != "Administrator":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to edit this decision",
            )

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
                update_data["impact_level"] = ImpactLevel.MEDIUM

        if "category_id" in update_data and update_data["category_id"] is not None:
            cat = db.query(DecisionCategory).filter(
                DecisionCategory.id == update_data["category_id"]
            ).first()
            if not cat:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid category_id",
                )

        if "stakeholder_ids" in update_data and update_data["stakeholder_ids"] is not None:
            update_data["stakeholder_ids"] = [
                str(sid) for sid in update_data["stakeholder_ids"]
            ]

        for key, value in update_data.items():
            setattr(decision, key, value)

        db.commit()
        db.refresh(decision)
        return decision

    # ------------------------------------------------------------------ #
    #  SUBMIT FOR REVIEW                                                   #
    # ------------------------------------------------------------------ #
    @staticmethod
    def submit(db: Session, decision_id: UUID, current_user: User) -> Decision:
        """
        Submit a draft decision for review.

        Validates:
        - Decision exists and is in DRAFT status
        - Current user is the owner
        - At least 1 alternative exists
        - At least 1 alternative is marked as recommended

        On success:
        - Status → UNDER_REVIEW
        - Creates a version snapshot
        """
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found"
            )

        if decision.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the decision creator can submit for review",
            )

        if decision.status != DecisionStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot submit a decision in '{decision.status.value}' status",
            )

        # Business rule: at least 1 alternative
        alt_count = (
            db.query(func.count(Alternative.id))
            .filter(Alternative.decision_id == decision_id)
            .scalar()
        )
        if alt_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one alternative is required before submission",
            )

        # Business rule: at least 1 recommended
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

        # Transition status
        decision.status = DecisionStatus.UNDER_REVIEW

        # Create version snapshot
        VersionService.create_snapshot(
            db, decision, current_user.id, change_summary="Submitted for review"
        )

        db.commit()
        db.refresh(decision)
        return decision

    # ------------------------------------------------------------------ #
    #  DELETE (soft)                                                        #
    # ------------------------------------------------------------------ #
    @staticmethod
    def delete(db: Session, decision_id: UUID, current_user: User) -> None:
        """
        Soft-delete (archive) a decision. Only DRAFT decisions can be deleted
        by owner or admin. Others are archived.
        """
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found"
            )

        role_name = current_user.role.name if current_user.role else ""
        if decision.created_by != current_user.id and role_name != "Administrator":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this decision",
            )

        decision.status = DecisionStatus.ARCHIVED
        db.commit()

    # ------------------------------------------------------------------ #
    #  STATS (for dashboard)                                               #
    # ------------------------------------------------------------------ #
    @staticmethod
    def get_user_stats(db: Session, user_id: UUID) -> dict:
        """Get decision stats for a user's dashboard."""
        total = db.query(func.count(Decision.id)).filter(
            Decision.created_by == user_id
        ).scalar()

        by_status = {}
        for s in DecisionStatus:
            count = (
                db.query(func.count(Decision.id))
                .filter(Decision.created_by == user_id, Decision.status == s)
                .scalar()
            )
            by_status[s.value] = count

        return {"total": total, "by_status": by_status}
