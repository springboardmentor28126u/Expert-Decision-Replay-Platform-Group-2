"""Decision schemas."""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


class DecisionCreate(BaseModel):
    """Schema for creating a decision."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None


class DecisionUpdate(BaseModel):
    """Schema for updating a decision."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None


class StatusUpdate(BaseModel):
    """Schema for changing decision status."""
    status: str = Field(
        ...,
        pattern="^(Draft|Under Review|Approved|Rejected|Archived)$",
    )


class DecisionResponse(BaseModel):
    """Schema for decision response."""
    id: int
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    creator: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


DecisionOut = DecisionResponse


class DecisionListResponse(BaseModel):
    """Schema for paginated decision list."""
    items: List[DecisionResponse]
    total: int
    page: int
    page_size: int
