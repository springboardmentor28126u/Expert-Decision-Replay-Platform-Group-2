"""
Expert Decision Replay Platform - Notifications Router
"""

from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List recent in-app notifications for the current user."""
    return NotificationService.list_for_user(db, current_user.id, limit=limit)


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return unread notification count for the current user."""
    return {"total": NotificationService.unread_count(db, current_user.id)}


@router.post("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all current-user notifications as read."""
    NotificationService.mark_all_read(db, current_user.id)
    return {"message": "Notifications marked as read"}
