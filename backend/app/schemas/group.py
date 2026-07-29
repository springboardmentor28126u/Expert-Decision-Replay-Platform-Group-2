"""
Expert Decision Replay Platform - Group Schemas
"""

from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None


class AdminGroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=2000)
    department: Optional[str] = Field(default=None, max_length=100)


class AdminGroupUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=2000)
    department: Optional[str] = Field(default=None, max_length=100)


class GroupResponse(BaseModel):
    id: UUID
    company_id: UUID
    name: str
    description: Optional[str] = None
    department: Optional[str] = None
    owner_id: UUID
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdminGroupListItem(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    department: Optional[str] = None
    owner_id: UUID
    member_count: int
    pending_request_count: int
    is_active: bool
    created_at: datetime


class AdminGroupDetailResponse(AdminGroupListItem):
    members: List["GroupMemberResponse"] = []
    pending_requests: List["GroupJoinRequestResponse"] = []


class GroupAddMember(BaseModel):
    user_id: UUID


class GroupMemberResponse(BaseModel):
    id: UUID
    group_id: UUID
    user_id: UUID
    created_at: datetime
    joined_at: datetime
    is_active: bool
    full_name: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True


class GroupOwnerSummary(BaseModel):
    id: UUID
    full_name: str
    avatar_initial: str


class GroupBrowseResponse(BaseModel):
    id: UUID
    company_id: UUID
    name: str
    description: Optional[str] = None
    owner: GroupOwnerSummary
    member_count: int
    pending_request_id: Optional[UUID] = None
    pending_request_status: Optional[str] = None


class GroupJoinRequestCreate(BaseModel):
    message: Optional[str] = Field(default=None, max_length=1000)


class GroupJoinRequestDecision(BaseModel):
    decision: str = Field(..., pattern=r"^(accept|reject)$")


class GroupJoinRequestResponse(BaseModel):
    id: UUID
    group_id: UUID
    group_name: str
    group_description: Optional[str] = None
    requested_by: UUID
    requester_name: str
    requester_initial: str
    requested_to: UUID
    owner_name: str
    owner_initial: str
    status: str
    message: Optional[str] = None
    decided_at: Optional[datetime] = None
    decided_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
