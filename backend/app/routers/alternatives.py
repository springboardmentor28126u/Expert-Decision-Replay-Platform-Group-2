"""Alternatives router — CRUD for decision alternatives."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.alternative import AlternativeCreate, AlternativeUpdate, AlternativeResponse
from app.services.alternative_service import AlternativeService

router = APIRouter(
    prefix="/api/decisions/{decision_id}/alternatives",
    tags=["Alternatives"],
)


@router.post("/", response_model=AlternativeResponse)
def create_alternative(
    decision_id: int,
    data: AlternativeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a new alternative to a decision."""
    service = AlternativeService(db)
    return service.create_alternative(decision_id, data)


@router.get("/", response_model=List[AlternativeResponse])
def list_alternatives(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all alternatives for a decision."""
    service = AlternativeService(db)
    return service.get_alternatives(decision_id)


@router.put("/{alt_id}", response_model=AlternativeResponse)
def update_alternative(
    decision_id: int,
    alt_id: int,
    data: AlternativeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an alternative."""
    service = AlternativeService(db)
    return service.update_alternative(alt_id, data)


@router.delete("/{alt_id}")
def delete_alternative(
    decision_id: int,
    alt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an alternative."""
    service = AlternativeService(db)
    service.delete_alternative(alt_id)
    return {"message": f"Alternative {alt_id} deleted successfully"}
