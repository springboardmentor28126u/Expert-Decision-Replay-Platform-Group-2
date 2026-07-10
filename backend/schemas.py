from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum


# -------------------------
# User Roles
# -------------------------
class UserRole(str, Enum):
    employee = "employee"
    reviewer = "reviewer"
    manager = "manager"
    admin = "admin"


# -------------------------
# User Registration
# -------------------------
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.employee


# -------------------------
# User Login
# -------------------------
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# -------------------------
# User Response
# -------------------------
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True


# -------------------------
# JWT Token Response
# -------------------------
class Token(BaseModel):
    access_token: str
    token_type: str


# -------------------------
# Token Payload
# -------------------------
class TokenData(BaseModel):
    email: Optional[str] = None


# ======================================================
# Decision Schemas
# (Used in future milestones)
# ======================================================

class DecisionStatus(str, Enum):
    draft = "draft"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"
    archived = "archived"


class DecisionCreate(BaseModel):
    title: str
    problem_statement: str
    category: Optional[str] = None


class DecisionResponse(BaseModel):
    id: int
    title: str
    problem_statement: str
    category: Optional[str]
    status: DecisionStatus
    created_by: int

    class Config:
        from_attributes = True