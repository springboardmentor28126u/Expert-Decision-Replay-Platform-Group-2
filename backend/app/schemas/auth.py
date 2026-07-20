"""Authentication schemas."""

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Schema for user registration."""
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    role: str = Field(default="Employee")


class LoginRequest(BaseModel):
    """Schema for user login (used for JSON login endpoint)."""
    email: str
    password: str


class TokenResponse(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    email: str
    role: str


class TokenData(BaseModel):
    """Schema for decoded token data."""
    user_id: int
    email: str
    role: str
