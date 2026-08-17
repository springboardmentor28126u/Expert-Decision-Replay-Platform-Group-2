from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class Notification(Base):
    """Notification model for in-app user notifications."""

    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    # Category: APPROVAL_REQUEST, DECISION_APPROVED, DECISION_REJECTED, NEW_COMMENT, STATUS_CHANGED
    type = Column(String(50), nullable=False, default="GENERAL")

    link_url = Column(String(500), nullable=True)

    is_read = Column(Boolean, default=False, nullable=False, index=True)

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return (
            f"<Notification(id={self.id}, "
            f"user_id={self.user_id}, "
            f"type='{self.type}', "
            f"is_read={self.is_read})>"
        )
