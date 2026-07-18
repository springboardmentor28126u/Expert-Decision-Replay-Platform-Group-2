"""
Expert Decision Replay Platform - Alternative Schemas

Pydantic schemas for alternative analysis operations.
"""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


class AlternativeCreate(BaseModel):
    """Schema for adding an alternative to a decision."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    pros: List[str] = Field(default_factory=list)
    cons: List[str] = Field(default_factory=list)
    estimated_cost: Optional[Decimal] = Field(None, ge=0)
    feasibility_score: Optional[int] = Field(None, ge=1, le=10)
    risk_level: str = Field(default="medium")  # low, medium, high
    is_recommended: bool = False


class AlternativeUpdate(BaseModel):
    """Schema for updating an alternative."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    pros: Optional[List[str]] = None
    cons: Optional[List[str]] = None
    estimated_cost: Optional[Decimal] = Field(None, ge=0)
    feasibility_score: Optional[int] = Field(None, ge=1, le=10)
    risk_level: Optional[str] = None
    is_recommended: Optional[bool] = None


class AlternativeResponse(BaseModel):
    """Schema for alternative in API responses."""
    id: UUID
    decision_id: UUID
    title: str
    description: Optional[str] = None
    pros: List[str] = []
    cons: List[str] = []
    estimated_cost: Optional[Decimal] = None
    feasibility_score: Optional[int] = None
    risk_level: str
    is_recommended: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
