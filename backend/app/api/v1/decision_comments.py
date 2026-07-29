"""
Expert Decision Replay Platform - Decision Comments Router

Instagram-style comment endpoints for decisions.
All routes are nested under /decisions/{decision_id}/comments.
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.decision_comment import (
    DecisionCommentCreate,
    DecisionCommentUpdate,
    DecisionCommentResponse,
    DecisionCommentLikeToggle,
    DecisionCommentListResponse,
    DecisionCommentMentionResult,
)
from app.schemas.common import MessageResponse
from app.services.decision_comment_service import DecisionCommentService
from app.models.user import User
from app.models.decision import Decision
from app.api.deps import get_current_user, can_access_decision

router = APIRouter()


def _get_decision_or_404(decision_id: UUID, db: Session) -> Decision:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


# ------------------------------------------------------------------
# POST / — Create a new comment
# ------------------------------------------------------------------
@router.post(
    "/{decision_id}/comments",
    response_model=DecisionCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    decision_id: UUID,
    data: DecisionCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = _get_decision_or_404(decision_id, db)
    can_access_decision(current_user, decision, db)
    return DecisionCommentService.create_comment(db, decision, data, current_user)


# ------------------------------------------------------------------
# GET / — List top-level comments (paginated)
# ------------------------------------------------------------------
@router.get(
    "/{decision_id}/comments",
    response_model=DecisionCommentListResponse,
)
def list_comments(
    decision_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = _get_decision_or_404(decision_id, db)
    can_access_decision(current_user, decision, db)
    items, total = DecisionCommentService.list_comments(db, decision_id, current_user.id, skip, limit)
    return DecisionCommentListResponse(items=items, total=total)


# ------------------------------------------------------------------
# GET /{comment_id}/replies — List all replies for a comment
# ------------------------------------------------------------------
@router.get(
    "/{decision_id}/comments/{comment_id}/replies",
    response_model=DecisionCommentListResponse,
)
def list_replies(
    decision_id: UUID,
    comment_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = _get_decision_or_404(decision_id, db)
    can_access_decision(current_user, decision, db)
    items, total = DecisionCommentService.list_replies(db, comment_id, current_user.id, skip, limit)
    return DecisionCommentListResponse(items=items, total=total)


# ------------------------------------------------------------------
# POST /{comment_id}/like — Toggle like
# ------------------------------------------------------------------
@router.post(
    "/{decision_id}/comments/{comment_id}/like",
    response_model=DecisionCommentLikeToggle,
)
def toggle_like(
    decision_id: UUID,
    comment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = _get_decision_or_404(decision_id, db)
    can_access_decision(current_user, decision, db)
    return DecisionCommentService.toggle_like(db, comment_id, current_user.id)


# ------------------------------------------------------------------
# PATCH /{comment_id} — Edit a comment
# ------------------------------------------------------------------
@router.patch(
    "/{decision_id}/comments/{comment_id}",
    response_model=DecisionCommentResponse,
)
def update_comment(
    decision_id: UUID,
    comment_id: UUID,
    data: DecisionCommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = _get_decision_or_404(decision_id, db)
    can_access_decision(current_user, decision, db)
    return DecisionCommentService.update_comment(db, comment_id, data, current_user.id)


# ------------------------------------------------------------------
# DELETE /{comment_id} — Soft-delete a comment
# ------------------------------------------------------------------
@router.delete(
    "/{decision_id}/comments/{comment_id}",
    response_model=MessageResponse,
)
def delete_comment(
    decision_id: UUID,
    comment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = _get_decision_or_404(decision_id, db)
    can_access_decision(current_user, decision, db)
    DecisionCommentService.delete_comment(db, decision, comment_id, current_user.id)
    return MessageResponse(message="Comment deleted successfully")


# ------------------------------------------------------------------
# GET /mentionable — Users who can be @mentioned
# ------------------------------------------------------------------
@router.get(
    "/{decision_id}/comments/mentionable",
    response_model=List[DecisionCommentMentionResult],
)
def get_mentionable_users(
    decision_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = _get_decision_or_404(decision_id, db)
    can_access_decision(current_user, decision, db)
    users = DecisionCommentService.get_mentionable_users(db, decision)
    return [DecisionCommentMentionResult(id=u.id, full_name=u.full_name) for u in users]
