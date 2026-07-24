"""
models/notification.py

Notification — an in-app alert delivered to a single User.

`related_entity_type` + `related_entity_id` form a deliberately
polymorphic, DB-unenforced reference. Unlike Attachment, integrity here
is non-critical — a notification pointing at a since-deleted entity
should degrade gracefully in the UI, not violate a constraint.
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy import Enum as PgEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import NotificationType
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class Notification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "notifications"

    recipient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    type: Mapped[NotificationType] = mapped_column(
        PgEnum(NotificationType, name="notification_type", native_enum=True),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    # Loosely-typed polymorphic pointer, see module docstring.
    related_entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    related_entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)

    # --- Relationships ---
    recipient: Mapped["User"] = relationship(back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification id={self.id} recipient_id={self.recipient_id} type={self.type}>"

