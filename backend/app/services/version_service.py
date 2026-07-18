"""
Expert Decision Replay Platform - Version Service

Creates immutable snapshots of decision state for version history.
"""

from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.decision import Decision
from app.models.decision_version import DecisionVersion


class VersionService:
    """Service for decision version history management."""

    @staticmethod
    def create_snapshot(
        db: Session,
        decision: Decision,
        user_id: UUID,
        change_summary: Optional[str] = None,
    ) -> DecisionVersion:
        """
        Create an immutable JSONB snapshot of the full decision state.

        Serializes the decision and all its alternatives into a single JSON blob.
        Increments the decision's current_version counter.
        """
        # Build snapshot payload
        alternatives_data = []
        for alt in decision.alternatives:
            alternatives_data.append({
                "id": str(alt.id),
                "title": alt.title,
                "description": alt.description,
                "pros": alt.pros or [],
                "cons": alt.cons or [],
                "estimated_cost": str(alt.estimated_cost) if alt.estimated_cost is not None else None,
                "feasibility_score": alt.feasibility_score,
                "risk_level": alt.risk_level.value if alt.risk_level else "medium",
                "is_recommended": alt.is_recommended,
            })

        snapshot = {
            "title": decision.title,
            "problem_statement": decision.problem_statement,
            "category_id": str(decision.category_id),
            "category_name": decision.category.name if decision.category else None,
            "status": decision.status.value,
            "impact_level": decision.impact_level.value,
            "target_date": decision.target_date.isoformat() if decision.target_date else None,
            "stakeholder_ids": [str(sid) for sid in (decision.stakeholder_ids or [])],
            "alternatives": alternatives_data,
        }

        version = DecisionVersion(
            decision_id=decision.id,
            version_number=decision.current_version,
            snapshot_json=snapshot,
            change_summary=change_summary,
            created_by=user_id,
        )
        db.add(version)

        # Increment version counter on the decision
        decision.current_version += 1

        return version

    @staticmethod
    def list_versions(db: Session, decision_id: UUID) -> List[DecisionVersion]:
        """Get all versions for a decision, ordered newest first."""
        return (
            db.query(DecisionVersion)
            .filter(DecisionVersion.decision_id == decision_id)
            .order_by(DecisionVersion.version_number.desc())
            .all()
        )

    @staticmethod
    def get_version(
        db: Session, decision_id: UUID, version_number: int
    ) -> DecisionVersion:
        """Get a specific version of a decision."""
        version = (
            db.query(DecisionVersion)
            .filter(
                DecisionVersion.decision_id == decision_id,
                DecisionVersion.version_number == version_number,
            )
            .first()
        )
        if not version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Version {version_number} not found",
            )
        return version
