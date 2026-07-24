"""
Expert Decision Replay Platform - Decisions Router

Endpoints for decision management CRUD, submission, and version history.
"""

from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.decision import (
    DecisionCreate,
    DecisionUpdate,
    DecisionResponse,
    DecisionListItem,
    ImplementationStatusUpdate,
    OutcomeUpdate,
)
from app.schemas.decision_version import DecisionVersionResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.decision_service import DecisionService
from app.services.version_service import VersionService
from app.models.user import User
from app.models.decision import Decision
from app.api.deps import get_current_user, get_company_context, CompanyContext, can_access_decision

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
    ctx: CompanyContext = Depends(get_company_context),
):
    """Create a new decision in DRAFT status in a company & group."""
    decision = DecisionService.create(
        db=db,
        data=data,
        user_id=ctx.user.id,
        company_id=ctx.company_id,
    )
    return _decision_to_response(decision)


@router.get("", response_model=PaginatedResponse)
def list_decisions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, alias="status"),
    category_id: Optional[UUID] = None,
    search: Optional[str] = None,
    my_only: bool = Query(False),
    pending_for_me: bool = Query(False),
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context),
):
    """
    List decisions scoped strictly to the requesting user's company and group memberships.
    """
    decisions, total = DecisionService.list_decisions(
        db=db,
        current_user=ctx.user,
        company_id=ctx.company_id,
        skip=skip,
        limit=limit,
        status_filter=status,
        category_id=category_id,
        search=search,
        my_only=my_only,
        pending_for_me=pending_for_me,
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
    ctx: CompanyContext = Depends(get_company_context),
):
    """Get decision statistics for the dashboard in a company."""
    return DecisionService.get_user_stats(db, ctx.user.id, ctx.company_id)


@router.get("/{decision_id}", response_model=DecisionResponse)
def get_decision(
    decision_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a decision by ID (server-side group access controlled)."""
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
    """Submit a draft decision for review."""
    decision = DecisionService.submit(db, decision_id, current_user)
    return _decision_to_response(decision)


@router.patch("/{decision_id}/implementation-status", response_model=DecisionResponse)
def update_implementation_status(
    decision_id: UUID,
    data: ImplementationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update implementation_status (not_started -> in_progress -> completed)."""
    decision = DecisionService.update_implementation_status(db, decision_id, data.implementation_status, current_user)
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


@router.patch("/{decision_id}/revise", response_model=DecisionResponse)
def revise_decision(
    decision_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Move a REJECTED decision back to DRAFT for revision."""
    decision = DecisionService.revise(db, decision_id, current_user)
    return _decision_to_response(decision)


@router.patch("/{decision_id}/outcome", response_model=DecisionResponse)
def set_decision_outcome(
    decision_id: UUID,
    data: OutcomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set the outcome for an approved decision."""
    decision = DecisionService.set_outcome(db, decision_id, data.outcome, data.outcome_notes, current_user)
    return _decision_to_response(decision)


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
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found")
    can_access_decision(current_user, decision, db)
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
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found")
    can_access_decision(current_user, decision, db)
    version = VersionService.get_version(db, decision_id, version_number)
    result = DecisionVersionResponse.model_validate(version)
    result.creator_name = version.creator.full_name if version.creator else None
    return result

