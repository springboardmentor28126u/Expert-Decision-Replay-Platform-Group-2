"""
Expert Decision Replay Platform - ApprovalRoutingRule Model

Defines conditional rules that modify approval chains based on decision attributes.
For example: "if financial_impact > $50,000, add a Finance Director level".
"""

import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Enum, ForeignKey, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class Operator(str, enum.Enum):
    """Comparison operators for rule conditions."""
    GT = "gt"      # greater than
    GTE = "gte"    # greater than or equal
    LT = "lt"      # less than
    LTE = "lte"    # less than or equal
    EQ = "eq"      # equal
    IN = "in"      # value in list (comma-separated)


class InsertPosition(str, enum.Enum):
    """Where to insert the additional approval level."""
    APPEND = "append"
    INSERT_BEFORE = "insert_before"


class ApprovalRoutingRule(Base):
    """
    Conditional rule that modifies approval chains based on decision attributes.

    Attributes:
        id: Unique rule identifier (UUID).
        company_id: FK to companies (tenant scoping).
        category: Category name this rule applies to (matches ApprovalChainConfig.category).
        condition_field: Decision field to evaluate (financial_impact, impact_level, risk_score).
        operator: Comparison operator.
        condition_value: Value to compare against (stored as string, cast at eval time).
        inserted_role: Role to add if condition matches.
        insert_position: Whether to append or insert at a specific position.
        insert_before_level: Level number to insert before (only used with INSERT_BEFORE).
        priority: Evaluation order if multiple rules match.
        active: Whether this rule is enabled.
        created_at: Timestamp when the rule was created.
    """
    __tablename__ = "approval_routing_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category = Column(String(100), nullable=False)
    condition_field = Column(String(50), nullable=False)
    operator = Column(Enum(Operator, name="routing_operator"), nullable=False)
    condition_value = Column(String(255), nullable=False)
    inserted_role = Column(String(50), nullable=False)
    insert_position = Column(
        Enum(InsertPosition, name="insert_position"),
        default=InsertPosition.APPEND,
        nullable=False,
    )
    insert_before_level = Column(Integer, nullable=True)
    priority = Column(Integer, nullable=False, default=0)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    company = relationship("Company")

    # Composite index for efficient rule lookup
    __table_args__ = (
        Index("ix_routing_rules_company_category", "company_id", "category", "active"),
    )

    def __repr__(self) -> str:
        return (
            f"<ApprovalRoutingRule(category={self.category}, "
            f"field={self.condition_field}, op={self.operator})>"
        )
