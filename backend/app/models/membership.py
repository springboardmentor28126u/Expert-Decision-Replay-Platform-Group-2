"""
Expert Decision Replay Platform - Membership Model

Defines company-scoped membership and role assignments.
"""

import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class CompanyRole(str, enum.Enum):
    """Company-scoped user roles."""
    ADMIN = "admin"
    MANAGER = "manager"
    REVIEWER = "reviewer"
    EMPLOYEE = "employee"


class Membership(Base):
    """
    Membership model — links a User to a Company with a company-scoped role.

    Attributes:
        id: Unique membership identifier (UUID).
        user_id: Foreign key to users.id.
        company_id: Foreign key to companies.id.
        role: Company-scoped role (admin, manager, employee).
        created_at: Creation timestamp.
    """
    __tablename__ = "memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(
        Enum(CompanyRole, name="company_role"),
        default=CompanyRole.EMPLOYEE,
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="memberships")
    company = relationship("Company", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("user_id", "company_id", name="uq_user_company_membership"),
    )

    def __repr__(self) -> str:
        return f"<Membership(user_id={self.user_id}, company_id={self.company_id}, role={self.role})>"
