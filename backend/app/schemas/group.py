"""
Expert Decision Replay Platform - Group Schemas
"""

from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class GroupResponse(BaseModel):
    id: UUID
    company_id: UUID
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class GroupAddMember(BaseModel):
    user_id: UUID


class GroupMemberResponse(BaseModel):
    id: UUID
    group_id: UUID
    user_id: UUID
    created_at: datetime
    full_name: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True
