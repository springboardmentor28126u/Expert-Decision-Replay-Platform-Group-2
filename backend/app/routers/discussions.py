"""Discussions router — comments, meeting notes, threaded discussions."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.discussion import DiscussionCreate, DiscussionUpdate, DiscussionResponse
from app.services.discussion_service import DiscussionService

router = APIRouter(
    prefix="/api/decisions/{decision_id}/discussions",
    tags=["Discussions"],
)


@router.post("/", response_model=DiscussionResponse)
def create_discussion(
    decision_id: int,
    data: DiscussionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a comment, meeting note, or decision rationale.

    Set `type` to 'comment', 'meeting_note', or 'rationale'.
    Set `parent_id` to reply to an existing discussion (threading).
    """
    service = DiscussionService(db)
    return service.create_discussion(decision_id, data, current_user)


@router.get("/", response_model=List[DiscussionResponse])
def list_discussions(
    decision_id: int,
    type: Optional[str] = Query(None, description="Filter by type: comment, meeting_note, rationale"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all discussions for a decision (top-level with threaded replies)."""
    service = DiscussionService(db)
    return service.get_discussions(decision_id, type_filter=type)


@router.put("/{discussion_id}", response_model=DiscussionResponse)
def update_discussion(
    decision_id: int,
    discussion_id: int,
    data: DiscussionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a discussion (only author or admin can edit)."""
    service = DiscussionService(db)
    return service.update_discussion(discussion_id, data, current_user)


@router.delete("/{discussion_id}")
def delete_discussion(
    decision_id: int,
    discussion_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a discussion (only author or admin)."""
    service = DiscussionService(db)
    service.delete_discussion(discussion_id, current_user)
    return {"message": f"Discussion {discussion_id} deleted successfully"}
