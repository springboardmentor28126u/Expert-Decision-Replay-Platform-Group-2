"""
Expert Decision Replay Platform - Decision Schemas

Pydantic schemas for decision management operations.
"""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime, date
from typing import Optional, List, Any

from app.schemas.decision_category import DecisionCategoryResponse
from app.schemas.alternative import AlternativeResponse


class DecisionCreate(BaseModel):
    """Schema for creating a new decision (draft)."""
    title: str = Field(..., min_length=3, max_length=255)
    problem_statement: str = Field(..., min_length=10)
    category_id: UUID
    group_id: UUID
    impact_level: str = Field(default="medium")  # low, medium, high
    target_date: Optional[date] = None
    stakeholder_ids: Optional[List[UUID]] = Field(default_factory=list)


class DecisionUpdate(BaseModel):
    """Schema for updating a draft decision."""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    problem_statement: Optional[str] = Field(None, min_length=10)
    category_id: Optional[UUID] = None
    group_id: Optional[UUID] = None
    impact_level: Optional[str] = None
    target_date: Optional[date] = None
    stakeholder_ids: Optional[List[UUID]] = None


class CreatorSummary(BaseModel):
    """Minimal user info for embedding in decision responses."""
    id: UUID
    full_name: str
    email: str

    class Config:
        from_attributes = True


class DecisionResponse(BaseModel):
    """Full decision response for detail views."""
    id: UUID
    company_id: UUID
    group_id: UUID
    title: str
    problem_statement: str
    category_id: UUID
    category: Optional[DecisionCategoryResponse] = None
    status: str
    impact_level: str
    created_by: UUID
    creator: Optional[CreatorSummary] = None
    current_version: int
    target_date: Optional[date] = None
    stakeholder_ids: Optional[List[UUID]] = None
    implementation_status: str
    outcome: Optional[str] = None
    outcome_notes: Optional[str] = None
    alternatives: List[AlternativeResponse] = []
    alternative_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ImplementationStatusUpdate(BaseModel):
    """Schema for updating implementation_status."""
    implementation_status: str = Field(..., pattern=r"^(not_started|in_progress|completed)$")


class DecisionListItem(BaseModel):
    """Lighter decision schema for list views."""
    id: UUID
    company_id: UUID
    group_id: UUID
    title: str
    status: str
    impact_level: str
    category: Optional[DecisionCategoryResponse] = None
    creator: Optional[CreatorSummary] = None
    alternative_count: int = 0
    current_version: int
    target_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OutcomeUpdate(BaseModel):
    """Schema for setting a decision outcome."""
    outcome: str = Field(..., pattern=r"^(success|partial|failed|pending)$")
    outcome_notes: Optional[str] = None

