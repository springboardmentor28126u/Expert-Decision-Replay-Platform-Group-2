from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# -----------------------------
# User Registration Schema
# -----------------------------
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "Employee"
    department: Optional[str] = None
    team: Optional[str] = None


# -----------------------------
# User Login Schema
# -----------------------------
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# -----------------------------
# User Response Schema
# -----------------------------
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    department: Optional[str]
    team: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# -----------------------------
# JWT Token Schema
# -----------------------------
class Token(BaseModel):
    access_token: str
    token_type: str


# -----------------------------
# Token Payload Schema
# -----------------------------
class TokenData(BaseModel):
    email: Optional[str] = None