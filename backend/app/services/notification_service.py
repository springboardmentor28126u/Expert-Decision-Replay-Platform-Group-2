"""
Expert Decision Replay Platform - Notification Service
"""

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.notification import Notification


class NotificationService:
    """Creates and reads in-app notifications. No email is sent here."""

    @staticmethod
    def create_in_app(
        db: Session,
        user_id: UUID,
        type: str,
        title: str,
        message: str,
        payload: Optional[dict[str, Any]] = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            payload=payload or {},
        )
        db.add(notification)
        return notification

    @staticmethod
    def list_for_user(db: Session, user_id: UUID, limit: int = 20) -> list[Notification]:
        return (
            db.query(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def unread_count(db: Session, user_id: UUID) -> int:
        return (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.read_at.is_(None))
            .count()
        )

    @staticmethod
    def mark_all_read(db: Session, user_id: UUID) -> None:
        (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.read_at.is_(None))
            .update({"read_at": datetime.now(timezone.utc)})
        )
        db.commit()
