"""Notifications router."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return [
        {
            "id": 1,
            "title": "Welcome to Expert Decision Replay Platform",
            "message": "Start documenting your organizational decisions.",
            "is_read": False,
            "created_at": "Just now",
        }
    ]
