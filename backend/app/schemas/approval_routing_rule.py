"""
Expert Decision Replay Platform - Approval Routing Rule Schemas

Pydantic schemas for approval routing rule operations.
"""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class RoutingRuleBase(BaseModel):
    """Base schema for routing rule data."""
    category: str = Field(..., min_length=1, max_length=100)
    condition_field: str = Field(..., min_length=1, max_length=50)
    operator: str = Field(..., pattern=r"^(gt|gte|lt|lte|eq|in)$")
    condition_value: str = Field(..., min_length=1, max_length=255)
    inserted_role: str = Field(..., min_length=1, max_length=50)
    insert_position: str = Field(default="append", pattern=r"^(append|insert_before)$")
    insert_before_level: Optional[int] = None
    priority: int = Field(default=0, ge=0)
    active: bool = True


class RoutingRuleCreate(RoutingRuleBase):
    """Schema for creating a new routing rule."""
    pass


class RoutingRuleUpdate(BaseModel):
    """Schema for updating a routing rule."""
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    condition_field: Optional[str] = Field(None, min_length=1, max_length=50)
    operator: Optional[str] = Field(None, pattern=r"^(gt|gte|lt|lte|eq|in)$")
    condition_value: Optional[str] = Field(None, min_length=1, max_length=255)
    inserted_role: Optional[str] = Field(None, min_length=1, max_length=50)
    insert_position: Optional[str] = Field(None, pattern=r"^(append|insert_before)$")
    insert_before_level: Optional[int] = None
    priority: Optional[int] = Field(None, ge=0)
    active: Optional[bool] = None


class RoutingRuleResponse(BaseModel):
    """Schema for routing rule in API responses."""
    id: UUID
    company_id: UUID
    category: str
    condition_field: str
    operator: str
    condition_value: str
    inserted_role: str
    insert_position: str
    insert_before_level: Optional[int] = None
    priority: int
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RoutingPreviewRequest(BaseModel):
    """Request schema for previewing routing rules."""
    category: str
    financial_impact: Optional[float] = None
    risk_score: Optional[int] = None
    impact_level: Optional[str] = None


class RoutingPreviewResponse(BaseModel):
    """Response schema for routing preview."""
    matching_rules: list
    additional_approvals_needed: int
