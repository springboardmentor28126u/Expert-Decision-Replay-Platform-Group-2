"""User schemas."""

from typing import Optional

from pydantic import BaseModel, Field


class UserBase(BaseModel):
    """Base user schema with shared fields."""
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=255)
    role: Optional[str] = "Employee"


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str = Field(..., min_length=6, max_length=128)


class UserUpdate(BaseModel):
    """Schema for updating a user's own profile."""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[str] = Field(None, min_length=5, max_length=255)


class UserAdminUpdate(BaseModel):
    """Schema for admin updating any user."""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[str] = Field(None, min_length=5, max_length=255)
    role: Optional[str] = None


class RoleUpdate(BaseModel):
    """Schema for changing a user's role."""
    role: str = Field(..., pattern="^(Employee|Reviewer|Manager|Administrator)$")


class PasswordUpdate(BaseModel):
    """Schema for changing password."""
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


class UserResponse(BaseModel):
    """Schema for user response (excludes password)."""
    id: int
    username: str
    email: str
    role: Optional[str] = None

    model_config = {"from_attributes": True}
