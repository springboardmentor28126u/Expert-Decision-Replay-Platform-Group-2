"""
Expert Decision Replay Platform - Approval Chain Config Model

Defines the configuration for the approval workflow chain per company,
optionally scoped to a specific group. A null group_id means the config
applies as the company-wide default for that category.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database.base import Base


class ApprovalChainConfig(Base):
    """
    Configuration for approval chains scoped per company and optionally per group.

    Attributes:
        id: Unique identifier.
        company_id: FK to companies — tenant boundary (required).
        group_id: FK to groups — nullable; null means company-wide default.
        category: Category name string (e.g. "Finance", "Engineering", "default").
        levels: JSONB ordered list of approval levels.
               Example: [{"level":1,"role":"manager"},{"level":2,"role":"admin"}]
        sla_hours: SLA in hours for the entire chain.
        created_at: Timestamp when created.
    """
    __tablename__ = "approval_chain_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    category = Column(String(100), nullable=False)
    levels = Column(JSONB, nullable=False, default=list)
    sla_hours = Column(Integer, nullable=True, default=24)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    company = relationship("Company")
    group = relationship("Group")

    __table_args__ = (
        UniqueConstraint(
            "company_id", "group_id", "category",
            name="uq_chain_company_group_category",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<ApprovalChainConfig(company_id={self.company_id}, "
            f"group_id={self.group_id}, category='{self.category}', "
            f"levels={self.levels})>"
        )
