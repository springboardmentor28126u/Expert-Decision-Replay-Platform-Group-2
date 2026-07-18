"""
Expert Decision Replay Platform - Role Schemas

Pydantic schemas for role-related operations.
"""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class RoleBase(BaseModel):
    """Base schema for role data."""
    name: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = Field(None, max_length=255)


class RoleCreate(RoleBase):
    """Schema for creating a new role."""
    pass


class RoleResponse(BaseModel):
    """Schema for role in API responses."""
    id: UUID
    name: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
