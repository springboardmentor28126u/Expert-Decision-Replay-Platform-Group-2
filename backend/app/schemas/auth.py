"""
Expert Decision Replay Platform - Auth Schemas

Request/response schemas for authentication endpoints.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID

class RegisterRequest(BaseModel):
    """Schema for user registration."""
    full_name: str = Field(..., min_length=2, max_length=100, examples=["John Doe"])
    email: EmailStr = Field(..., examples=["john.doe@example.com"])
    password: str = Field(..., min_length=8, max_length=128, examples=["StrongP@ss1"])
    confirm_password: str = Field(..., min_length=8, max_length=128, examples=["StrongP@ss1"])


class LoginRequest(BaseModel):
    """Schema for user login."""
    email: EmailStr = Field(..., examples=["john.doe@example.com"])
    password: str = Field(..., min_length=1, examples=["StrongP@ss1"])



class TokenResponse(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Schema for token refresh."""
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request."""
    email: EmailStr = Field(..., examples=["john.doe@example.com"])


class ChangePasswordRequest(BaseModel):
    """Schema for password change."""
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_new_password: str = Field(..., min_length=8, max_length=128)


class ResetPasswordRequest(BaseModel):
    """Schema for resetting password via a reset token."""
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)

