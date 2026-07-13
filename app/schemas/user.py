# schemas/user.py
"""
schemas/user.py

Distinct Create / Update / Out schemas per the architecture's rule:
never expose the raw ORM model or reuse one schema for both input and
output. In particular, `hashed_password` never appears on any "Out"
schema — Pydantic's explicit field list means it simply can't leak,
even by accident.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.common import ORMBase


class UserBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr


class UserCreate(UserBase):
    """Admin-only: create a new user account."""
    password: str = Field(min_length=8, max_length=128)
    role_id: uuid.UUID
    team_id: Optional[uuid.UUID] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not any(c.isdigit() for c in value):
            raise ValueError("Password must contain at least one digit.")
        if not any(c.isalpha() for c in value):
            raise ValueError("Password must contain at least one letter.")
        return value


class UserUpdate(BaseModel):
    """Admin-only: update any user's profile, role, team, or active status."""
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    role_id: Optional[uuid.UUID] = None
    team_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class UserSelfUpdate(BaseModel):
    """
    Self-service profile update (PATCH /users/me). Deliberately excludes
    role_id, team_id, and is_active — a user can never elevate their own
    privileges or reassign themselves; only an Administrator can via
    UserUpdate.
    """
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=150)


class PasswordChange(BaseModel):
    """POST /users/me/password — requires the current password to confirm intent."""
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not any(c.isdigit() for c in value):
            raise ValueError("Password must contain at least one digit.")
        if not any(c.isalpha() for c in value):
            raise ValueError("Password must contain at least one letter.")
        return value


class RoleAssignRequest(BaseModel):
    """Body for PATCH /users/{user_id}/role — replaces the old bare query param."""
    role_id: uuid.UUID


class RoleSummary(ORMBase):
    """Lightweight nested role, avoids importing the full RoleOut cycle."""
    id: uuid.UUID
    name: str


class TeamSummary(ORMBase):
    """Lightweight nested team."""
    id: uuid.UUID
    name: str


class UserOut(ORMBase):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    is_active: bool
    is_verified: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    role: RoleSummary
    team: Optional[TeamSummary] = None
