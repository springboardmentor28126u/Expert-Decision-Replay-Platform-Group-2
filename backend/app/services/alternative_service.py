"""
Expert Decision Replay Platform - Alternative Service

Business logic for the Alternative Analysis module.
"""

from typing import List
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.alternative import Alternative
from app.models.decision import Decision, DecisionStatus, ImpactLevel
from app.schemas.alternative import AlternativeCreate, AlternativeUpdate


class AlternativeService:
    """Service for managing decision alternatives."""

    @staticmethod
    def _get_decision_for_edit(db: Session, decision_id: UUID, user_id: UUID) -> Decision:
        """Get a decision and verify it's editable by this user."""
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Decision not found",
            )
        if decision.status != DecisionStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Alternatives can only be modified for draft decisions",
            )
        if decision.created_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the decision creator can modify alternatives",
            )
        return decision

    @staticmethod
    def create(
        db: Session,
        decision_id: UUID,
        data: AlternativeCreate,
        user_id: UUID,
    ) -> Alternative:
        """Add a new alternative to a decision."""
        AlternativeService._get_decision_for_edit(db, decision_id, user_id)

        # Map risk_level string to enum
        try:
            risk = ImpactLevel(data.risk_level)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid risk_level '{data.risk_level}'. Must be one of: low, medium, high",
            )

        alternative = Alternative(
            decision_id=decision_id,
            title=data.title,
            description=data.description,
            pros=data.pros,
            cons=data.cons,
            estimated_cost=data.estimated_cost,
            feasibility_score=data.feasibility_score,
            risk_level=risk,
            is_recommended=data.is_recommended,
        )
        db.add(alternative)
        db.commit()
        db.refresh(alternative)
        return alternative

    @staticmethod
    def update(
        db: Session,
        decision_id: UUID,
        alternative_id: UUID,
        data: AlternativeUpdate,
        user_id: UUID,
    ) -> Alternative:
        """Update an existing alternative."""
        AlternativeService._get_decision_for_edit(db, decision_id, user_id)

        alternative = (
            db.query(Alternative)
            .filter(Alternative.id == alternative_id, Alternative.decision_id == decision_id)
            .first()
        )
        if not alternative:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alternative not found",
            )

        update_data = data.model_dump(exclude_unset=True)
        if "risk_level" in update_data and update_data["risk_level"] is not None:
            try:
                update_data["risk_level"] = ImpactLevel(update_data["risk_level"])
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid risk_level '{update_data['risk_level']}'. Must be one of: low, medium, high",
                )

        for key, value in update_data.items():
            setattr(alternative, key, value)

        db.commit()
        db.refresh(alternative)
        return alternative

    @staticmethod
    def delete(
        db: Session,
        decision_id: UUID,
        alternative_id: UUID,
        user_id: UUID,
    ) -> None:
        """Remove an alternative from a decision."""
        AlternativeService._get_decision_for_edit(db, decision_id, user_id)

        alternative = (
            db.query(Alternative)
            .filter(Alternative.id == alternative_id, Alternative.decision_id == decision_id)
            .first()
        )
        if not alternative:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alternative not found",
            )

        db.delete(alternative)
        db.commit()

    @staticmethod
    def list_by_decision(db: Session, decision_id: UUID) -> List[Alternative]:
        """Get all alternatives for a decision."""
        return (
            db.query(Alternative)
            .filter(Alternative.decision_id == decision_id)
            .order_by(Alternative.created_at)
            .all()
        )
