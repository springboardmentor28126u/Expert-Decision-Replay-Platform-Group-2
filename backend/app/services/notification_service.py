from typing import List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.exceptions.handlers import NotFoundException
from app.database import Base, engine


class NotificationService:
    """Service for managing user in-app notifications."""

    def __init__(self, db: Session):
        self.db = db
        try:
            Base.metadata.create_all(bind=engine)
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_url VARCHAR(500);"))
                conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'GENERAL';"))
                conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;"))
                conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"))
        except Exception:
            pass



    def create_notification(
        self,
        user_id: int,
        title: str,
        message: str,
        type: str = "GENERAL",
        link_url: Optional[str] = None
    ) -> Notification:
        """Create a new notification for a specific user."""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            link_url=link_url,
            is_read=False
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_user_notifications(
        self,
        user_id: int,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0
    ) -> List[Notification]:
        """Fetch notifications for a specific user, ordered by creation date descending."""
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        return query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()

    def get_unread_count(self, user_id: int) -> int:
        """Get total count of unread notifications for a user."""
        return self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()

    def mark_as_read(self, notification_id: int, user_id: int) -> Notification:
        """Mark a single notification as read."""
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()

        if not notification:
            raise NotFoundException("Notification not found")

        notification.is_read = True
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def mark_all_as_read(self, user_id: int) -> int:
        """Mark all unread notifications for a user as read."""
        updated = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True}, synchronize_session=False)

        self.db.commit()
        return updated
