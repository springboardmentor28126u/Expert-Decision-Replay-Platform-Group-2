"""
Expert Decision Replay Platform - Company Schemas
"""

from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr
from app.models.membership import CompanyRole


class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = Field(None, min_length=2, max_length=100)


class CompanyResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True


class CompanyWithRole(BaseModel):
    id: UUID
    name: str
    slug: str
    role: CompanyRole
    created_at: datetime

    class Config:
        from_attributes = True


class CompanyInvite(BaseModel):
    email: EmailStr
    role: CompanyRole = CompanyRole.EMPLOYEE
