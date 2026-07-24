"""
Expert Decision Replay Platform - User Model

Defines the users table with authentication fields.
Role is scoped per company via the Membership model.
"""

import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class UserStatus(str, enum.Enum):
    """Enumeration of possible user statuses."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class UserRole(str, enum.Enum):
    """Global user-level role (used for route-level authorization)."""
    ADMIN = "admin"
    MANAGER = "manager"
    REVIEWER = "reviewer"
    EMPLOYEE = "employee"


class User(Base):
    """
    User model for authentication and identity.

    Attributes:
        id: Unique user identifier (UUID).
        full_name: User's full display name.
        email: Unique email address used for login.
        password_hash: Bcrypt-hashed password.
        status: Account status (active, inactive, suspended).
        created_at: Timestamp when the user was created.
        updated_at: Timestamp of last update.
        memberships: Relationship to company memberships.
        group_memberships: Relationship to group memberships.
        profile: One-to-one relationship to extended profile.
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    status = Column(
        SAEnum(UserStatus, name="user_status"),
        default=UserStatus.ACTIVE,
        nullable=False,
    )
    role = Column(
        SAEnum(UserRole, name="user_role"),
        default=UserRole.EMPLOYEE,
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")
    group_memberships = relationship("GroupMembership", back_populates="user", cascade="all, delete-orphan")
    profile = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="joined",
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"

