"""Discussion schemas."""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


class DiscussionCreate(BaseModel):
    """Schema for creating a discussion entry."""
    comment: str = Field(..., min_length=1)
    parent_id: Optional[int] = None
    type: str = Field(default="comment", pattern="^(comment|meeting_note|rationale)$")


class DiscussionUpdate(BaseModel):
    """Schema for updating a discussion entry."""
    comment: Optional[str] = Field(None, min_length=1)


class DiscussionResponse(BaseModel):
    """Schema for discussion response."""
    id: int
    decision_id: Optional[int] = None
    user_id: Optional[int] = None
    parent_id: Optional[int] = None
    type: Optional[str] = None
    comment: str
    created_at: Optional[datetime] = None
    user: Optional[UserResponse] = None
    replies: List["DiscussionResponse"] = []

    model_config = {"from_attributes": True}
