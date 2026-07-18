"""
Expert Decision Replay Platform - PasswordResetToken Model

Stores hashed password-reset tokens with expiry and single-use enforcement.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class PasswordResetToken(Base):
    """
    Password reset token model.

    Stores the SHA-256 hash of the raw token (never the raw token itself).
    Each token is single-use and time-limited.

    Attributes:
        id: Unique identifier (UUID).
        user_id: Foreign key to the user who requested the reset.
        token_hash: SHA-256 hash of the raw reset token.
        expires_at: When this token becomes invalid.
        used: Whether this token has already been consumed.
        created_at: Timestamp when the token was created.
        user: Relationship to the owning user.
    """
    __tablename__ = "password_reset_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    token_hash = Column(String(64), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", lazy="joined")

    def __repr__(self) -> str:
        return f"<PasswordResetToken(id={self.id}, user_id={self.user_id}, used={self.used})>"

    @property
    def is_expired(self) -> bool:
        """Check if the token has passed its expiry time."""
        return datetime.now(timezone.utc) > self.expires_at

    @property
    def is_valid(self) -> bool:
        """Check if the token is still usable (not expired and not used)."""
        return not self.used and not self.is_expired
