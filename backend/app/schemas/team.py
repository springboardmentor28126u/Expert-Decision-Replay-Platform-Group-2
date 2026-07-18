"""
Expert Decision Replay Platform - Team Schemas

Pydantic schemas for team-related operations.
"""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class TeamBase(BaseModel):
    """Base schema for team data."""
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None


class TeamCreate(TeamBase):
    """Schema for creating a new team."""
    pass


class TeamUpdate(BaseModel):
    """Schema for updating an existing team."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None


class TeamResponse(BaseModel):
    """Schema for team in API responses."""
    id: UUID
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    member_count: Optional[int] = 0

    class Config:
        from_attributes = True
