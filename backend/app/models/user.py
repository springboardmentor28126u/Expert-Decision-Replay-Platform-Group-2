"""
Expert Decision Replay Platform - User Model

Defines the users table with authentication and organizational fields.
"""

import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class UserStatus(str, enum.Enum):
    """Enumeration of possible user statuses."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class User(Base):
    """
    User model for authentication and identity.

    Attributes:
        id: Unique user identifier (UUID).
        full_name: User's full display name.
        email: Unique email address used for login.
        password_hash: Bcrypt-hashed password.
        role_id: Foreign key to the roles table.
        team_id: Foreign key to the teams table (nullable).
        status: Account status (active, inactive, suspended).
        created_at: Timestamp when the user was created.
        updated_at: Timestamp of last update.
        role: Relationship to the user's role.
        team: Relationship to the user's team.
        profile: One-to-one relationship to extended profile.
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    status = Column(
        Enum(UserStatus, name="user_status"),
        default=UserStatus.ACTIVE,
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    role = relationship("Role", back_populates="users", lazy="joined")
    team = relationship("Team", back_populates="members", lazy="joined")
    profile = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="joined",
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
