"""
Expert Decision Replay Platform - Decision Comment Schemas

Pydantic models for comment creation, responses, and like toggles.
"""

from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class DecisionCommentCreate(BaseModel):
    """Schema for creating a new comment."""
    content: str = Field(..., min_length=1, max_length=2000)
    parent_comment_id: Optional[UUID] = None


class DecisionCommentUpdate(BaseModel):
    """Schema for editing a comment."""
    content: str = Field(..., min_length=1, max_length=2000)


class DecisionCommentAuthor(BaseModel):
    """Author summary embedded in comment responses."""
    id: UUID
    full_name: str
    model_config = ConfigDict(from_attributes=True)


class DecisionCommentResponse(BaseModel):
    """Full comment response with computed fields."""
    id: UUID
    decision_id: UUID
    author_id: UUID
    author: DecisionCommentAuthor
    content: str
    parent_comment_id: Optional[UUID] = None
    is_edited: bool = False
    created_at: datetime
    updated_at: datetime
    like_count: int = 0
    liked_by_me: bool = False
    reply_count: int = 0
    reply_previews: List["DecisionCommentResponse"] = []

    model_config = ConfigDict(from_attributes=True)


class DecisionCommentLikeToggle(BaseModel):
    """Response for like/unlike toggle."""
    liked: bool
    like_count: int


class DecisionCommentMentionResult(BaseModel):
    """User matching an @mention who has access to the decision."""
    id: UUID
    full_name: str
    model_config = ConfigDict(from_attributes=True)


class DecisionCommentListResponse(BaseModel):
    """Paginated comment list."""
    items: List[DecisionCommentResponse]
    total: int
