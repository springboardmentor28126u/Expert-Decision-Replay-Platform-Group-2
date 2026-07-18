"""
Expert Decision Replay Platform - Decision Category Model

Lookup table for decision categories.
Admins can add new categories without code changes.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class DecisionCategory(Base):
    """
    Decision category for organizing decisions.

    Attributes:
        id: Unique category identifier (UUID).
        name: Category name (unique).
        description: Description of the category.
        created_at: Timestamp when the category was created.
        decisions: Relationship to decisions in this category.
    """
    __tablename__ = "decision_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    decisions = relationship("Decision", back_populates="category", lazy="selectin")

    def __repr__(self) -> str:
        return f"<DecisionCategory(id={self.id}, name={self.name})>"
