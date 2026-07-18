"""
Expert Decision Replay Platform - UserProfile Model

Defines the user_profiles table for extended user information.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class UserProfile(Base):
    """
    Extended user profile model.

    Stores additional user information beyond authentication fields.
    One-to-one relationship with the users table.

    Attributes:
        id: Unique profile identifier (UUID).
        user_id: Foreign key to the users table (unique, one-to-one).
        phone: Contact phone number.
        department: User's department within the organization.
        designation: Job title or designation.
        avatar_url: URL to the user's profile picture.
        bio: Free-text biography or description.
        created_at: Timestamp when the profile was created.
        updated_at: Timestamp of last update.
        user: Back-reference to the user.
    """
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    phone = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"<UserProfile(id={self.id}, user_id={self.user_id})>"
