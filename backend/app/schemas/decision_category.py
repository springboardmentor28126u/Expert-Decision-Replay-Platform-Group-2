"""
Expert Decision Replay Platform - Decision Category Schemas

Pydantic schemas for decision category operations.
"""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class DecisionCategoryCreate(BaseModel):
    """Schema for creating a new decision category."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class DecisionCategoryResponse(BaseModel):
    """Schema for decision category in API responses."""
    id: UUID
    name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
