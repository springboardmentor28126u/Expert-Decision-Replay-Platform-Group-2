"""
Expert Decision Replay Platform - Company Model

Defines the companies table (the tenant / organization entity).
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class Company(Base):
    """
    Company model — tenant/organization boundary.

    Attributes:
        id: Unique company identifier (UUID).
        name: Display name of the company.
        slug: Unique URL-friendly slug.
        created_at: Creation timestamp.
    """
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    groups = relationship("Group", back_populates="company", cascade="all, delete-orphan")
    memberships = relationship("Membership", back_populates="company", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="company", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Company(id={self.id}, name='{self.name}', slug='{self.slug}')>"
