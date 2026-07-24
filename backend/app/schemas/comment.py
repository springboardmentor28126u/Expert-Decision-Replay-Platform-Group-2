"""
schemas/comment.py
"""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class CommentBase(BaseModel):
    content: str = Field(min_length=1, max_length=10_000)
    is_meeting_note: bool = False


class CommentCreate(CommentBase):
    alternative_id: Optional[uuid.UUID] = None
    parent_comment_id: Optional[uuid.UUID] = None


class CommentUpdate(BaseModel):
    """Only the author (or an Administrator) may edit a comment's content."""
    content: str = Field(min_length=1, max_length=10_000)


class CommentAuthorSummary(ORMBase):
    id: uuid.UUID
    full_name: str


class CommentOut(ORMBase):
    id: uuid.UUID
    decision_id: uuid.UUID
    alternative_id: Optional[uuid.UUID] = None
    parent_comment_id: Optional[uuid.UUID] = None
    content: str
    is_meeting_note: bool
    created_at: datetime
    updated_at: datetime
    author: CommentAuthorSummary


class CommentThreadOut(CommentOut):
    """Used when a router chooses to eagerly nest replies one level deep."""
    replies: List[CommentOut] = []

