"""
Expert Decision Replay Platform - Decisions Router

Endpoints for decision management CRUD, submission, and version history.
"""

from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.decision import (
    DecisionCreate,
    DecisionUpdate,
    DecisionResponse,
    DecisionListItem,
)
from app.schemas.decision_version import DecisionVersionResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.decision_service import DecisionService
from app.services.version_service import VersionService
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()


def _decision_to_response(decision) -> dict:
    """Convert a Decision ORM object to a response dict with computed fields."""
    resp = DecisionResponse.model_validate(decision)
    resp.alternative_count = len(decision.alternatives) if decision.alternatives else 0
    return resp


def _decision_to_list_item(decision) -> dict:
    """Convert a Decision ORM object to a list item dict."""
    item = DecisionListItem.model_validate(decision)
    item.alternative_count = len(decision.alternatives) if decision.alternatives else 0
    return item


# ------------------------------------------------------------------ #
#  CRUD                                                                #
# ------------------------------------------------------------------ #

@router.post("", response_model=DecisionResponse, status_code=status.HTTP_201_CREATED)
def create_decision(
    data: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new decision in DRAFT status."""
    decision = DecisionService.create(db, data, current_user.id)
    return _decision_to_response(decision)


@router.get("", response_model=PaginatedResponse)
def list_decisions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, alias="status"),
    category_id: Optional[UUID] = None,
    search: Optional[str] = None,
    my_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List decisions with filtering, pagination, and role-based access.

    Query params:
    - status: filter by decision status (draft, under_review, approved, rejected, archived)
    - category_id: filter by category
    - search: full-text search on title and problem statement
    - my_only: if true, only return current user's decisions
    """
    decisions, total = DecisionService.list_decisions(
        db, current_user, skip, limit, status, category_id, search, my_only
    )
    items = [_decision_to_list_item(d) for d in decisions]

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.get("/stats")
def get_decision_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get decision statistics for the current user's dashboard."""
    return DecisionService.get_user_stats(db, current_user.id)


@router.get("/{decision_id}", response_model=DecisionResponse)
def get_decision(
    decision_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a decision by ID (access controlled)."""
    decision = DecisionService.get_by_id(db, decision_id, current_user)
    return _decision_to_response(decision)


@router.put("/{decision_id}", response_model=DecisionResponse)
def update_decision(
    decision_id: UUID,
    data: DecisionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a draft decision."""
    decision = DecisionService.update(db, decision_id, data, current_user)
    return _decision_to_response(decision)


@router.patch("/{decision_id}/submit", response_model=DecisionResponse)
def submit_decision(
    decision_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit a draft decision for review.

    Validates that at least one alternative exists and at least
    one is marked as recommended.
    """
    decision = DecisionService.submit(db, decision_id, current_user)
    return _decision_to_response(decision)


@router.delete("/{decision_id}", response_model=MessageResponse)
def delete_decision(
    decision_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete (archive) a decision."""
    DecisionService.delete(db, decision_id, current_user)
    return {"message": "Decision archived successfully"}


# ------------------------------------------------------------------ #
#  VERSION HISTORY                                                     #
# ------------------------------------------------------------------ #

@router.get("/{decision_id}/versions")
def list_versions(
    decision_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all version snapshots for a decision."""
    # Verify access
    DecisionService.get_by_id(db, decision_id, current_user)

    versions = VersionService.list_versions(db, decision_id)
    result = []
    for v in versions:
        item = DecisionVersionResponse.model_validate(v)
        item.creator_name = v.creator.full_name if v.creator else None
        result.append(item)
    return result


@router.get("/{decision_id}/versions/{version_number}")
def get_version(
    decision_id: UUID,
    version_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific version snapshot of a decision."""
    # Verify access
    DecisionService.get_by_id(db, decision_id, current_user)

    version = VersionService.get_version(db, decision_id, version_number)
    result = DecisionVersionResponse.model_validate(version)
    result.creator_name = version.creator.full_name if version.creator else None
    return result
