"""
Expert Decision Replay Platform - Role Model

Defines the roles table for role-based access control.
Predefined roles: Employee, Reviewer, Manager, Administrator.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class Role(Base):
    """
    Role model for RBAC.

    Attributes:
        id: Unique role identifier (UUID).
        name: Role name (unique). One of: Employee, Reviewer, Manager, Administrator.
        description: Human-readable description of the role's permissions.
        created_at: Timestamp when the role was created.
        users: Relationship to users assigned this role.
    """
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    users = relationship("User", back_populates="role", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name={self.name})>"
