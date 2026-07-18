"""
Expert Decision Replay Platform - Alternatives Router

Endpoints for managing alternatives within a decision.
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.alternative import AlternativeCreate, AlternativeUpdate, AlternativeResponse
from app.schemas.common import MessageResponse
from app.services.alternative_service import AlternativeService
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()


@router.get(
    "/{decision_id}/alternatives",
    response_model=List[AlternativeResponse],
)
def list_alternatives(
    decision_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all alternatives for a decision."""
    return AlternativeService.list_by_decision(db, decision_id)


@router.post(
    "/{decision_id}/alternatives",
    response_model=AlternativeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_alternative(
    decision_id: UUID,
    data: AlternativeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new alternative to a decision (decision must be in DRAFT)."""
    return AlternativeService.create(db, decision_id, data, current_user.id)


@router.put(
    "/{decision_id}/alternatives/{alternative_id}",
    response_model=AlternativeResponse,
)
def update_alternative(
    decision_id: UUID,
    alternative_id: UUID,
    data: AlternativeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an alternative (decision must be in DRAFT)."""
    return AlternativeService.update(db, decision_id, alternative_id, data, current_user.id)


@router.delete(
    "/{decision_id}/alternatives/{alternative_id}",
    response_model=MessageResponse,
)
def delete_alternative(
    decision_id: UUID,
    alternative_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove an alternative from a decision (decision must be in DRAFT)."""
    AlternativeService.delete(db, decision_id, alternative_id, current_user.id)
    return {"message": "Alternative deleted successfully"}
