"""Decision management router — CRUD, status, categories."""

from typing import Optional, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.decision import (
    DecisionCreate,
    DecisionUpdate,
    DecisionResponse,
    DecisionListResponse,
    StatusUpdate,
)
from app.schemas.version import VersionResponse
from app.services.decision_service import DecisionService
from app.services.version_service import VersionService

router = APIRouter(prefix="/api/decisions", tags=["Decisions"])


@router.post("/", response_model=DecisionResponse)
def create_decision(
    data: DecisionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new decision (starts as Draft)."""
    service = DecisionService(db)
    return service.create_decision(data, current_user)


@router.get("/", response_model=DecisionListResponse)
def list_decisions(
    status: Optional[str] = Query(None, description="Filter by status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    my_decisions: bool = Query(False, description="Show only my decisions"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List decisions with optional filters and pagination."""
    service = DecisionService(db)
    created_by = current_user.id if my_decisions else None
    return service.get_decisions(
        status=status,
        category=category,
        created_by=created_by,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get("/categories", response_model=List[str])
def get_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all unique decision categories."""
    service = DecisionService(db)
    return service.get_categories()


@router.get("/{decision_id}", response_model=DecisionResponse)
def get_decision(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single decision with all related data."""
    service = DecisionService(db)
    return service.get_decision(decision_id)


@router.put("/{decision_id}", response_model=DecisionResponse)
def update_decision(
    decision_id: int,
    data: DecisionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a decision. Automatically creates a version history record."""
    service = DecisionService(db)
    return service.update_decision(decision_id, data, current_user)


@router.patch("/{decision_id}/status", response_model=DecisionResponse)
def update_status(
    decision_id: int,
    data: StatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change the status of a decision."""
    service = DecisionService(db)
    return service.update_status(decision_id, data.status, current_user)


@router.delete("/{decision_id}")
def delete_decision(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a decision and all related data."""
    service = DecisionService(db)
    service.delete_decision(decision_id)
    return {"message": f"Decision {decision_id} deleted successfully"}


# --- Version History ---

@router.get("/{decision_id}/history", response_model=List[VersionResponse])
def get_decision_history(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get version history for a decision."""
    version_service = VersionService(db)
    return version_service.get_history(decision_id)
