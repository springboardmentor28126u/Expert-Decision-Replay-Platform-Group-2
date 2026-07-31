from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from models import Notification

from database import get_db
from models import Notification, User
from auth import get_current_user  # Adjust to match your existing auth helper
from schemas import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationResponse])
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch all notifications for the logged-in user."""
    return db.query(Notification)\
             .filter(Notification.user_id == current_user.id)\
             .order_by(Notification.created_at.desc())\
             .all()

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a specific notification as read."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification

@router.patch("/read-all", status_code=status.HTTP_200_OK)
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all unread notifications as read for current user."""
    db.query(Notification)\
      .filter(Notification.user_id == current_user.id, Notification.is_read == False)\
      .update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
def create_notification(db: Session, user_id: int, title: str, message: str, type: str = "info", link: str = None):
    """Helper to insert a new notification into the database."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        link=link
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification