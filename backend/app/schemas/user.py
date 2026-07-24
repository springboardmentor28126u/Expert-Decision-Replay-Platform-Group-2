"""
Expert Decision Replay Platform - User Schemas

Pydantic schemas for user-related operations.
"""

from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class UserProfileBase(BaseModel):
    """Base schema for user profile data."""
    phone: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    designation: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = None


class UserProfileUpdate(UserProfileBase):
    """Schema for updating a user profile."""
    pass


class UserProfileResponse(UserProfileBase):
    """Schema for user profile in API responses."""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    """Base schema for user data."""
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    status: Optional[str] = None


class AssignRoleRequest(BaseModel):
    """Schema for assigning a role to a user."""
    role: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    """Schema for user in API responses."""
    id: UUID
    full_name: str
    email: str
    status: str
    role: str = "employee"
    profile: Optional[UserProfileResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

