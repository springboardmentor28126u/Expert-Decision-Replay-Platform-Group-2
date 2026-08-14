from sqlalchemy.orm import Session
from app.models.notification import Notification


def create_notification(db: Session, user_id: int, message: str, type: str, related_decision_id: int = None):
    notif = Notification(
        user_id=user_id,
        message=message,
        type=type,
        related_decision_id=related_decision_id,
    )
    db.add(notif)
    db.commit()