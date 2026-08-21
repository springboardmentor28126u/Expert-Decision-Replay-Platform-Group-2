"""
Expert Decision Replay Platform - Approval Chain Schemas

Pydantic schemas for approval chain configuration CRUD.
"""

from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class ApprovalChainLevel(BaseModel):
    """A single level in an approval chain."""
    level: int = Field(..., ge=1, description="Sequential level number (1-based)")
    role: str = Field(..., description="Company role required: manager, admin, or employee")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = {"manager", "admin", "employee"}
        if v.lower() not in allowed:
            raise ValueError(f"Role must be one of: {', '.join(sorted(allowed))}")
        return v.lower()


class ApprovalChainCreate(BaseModel):
    """Schema for creating a new approval chain configuration."""
    category: str = Field(..., min_length=1, max_length=100)
    group_id: Optional[UUID] = None
    levels: List[ApprovalChainLevel] = Field(..., min_length=1)
    sla_hours: Optional[int] = Field(default=24, ge=1)


class ApprovalChainUpdate(BaseModel):
    """Schema for updating an existing approval chain configuration."""
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    group_id: Optional[UUID] = None
    levels: Optional[List[ApprovalChainLevel]] = Field(None, min_length=1)
    sla_hours: Optional[int] = Field(None, ge=1)


class ApprovalChainResponse(BaseModel):
    """Response schema for approval chain configuration."""
    id: UUID
    company_id: UUID
    group_id: Optional[UUID] = None
    category: str
    levels: List[dict]
    sla_hours: Optional[int] = None
    created_at: datetime
    group_name: Optional[str] = None

    class Config:
        from_attributes = True


class ApprovalChainCheckResponse(BaseModel):
    """Response for checking if a category+group has a configured chain."""
    has_chain: bool
    chain: Optional[ApprovalChainResponse] = None
    admin_name: Optional[str] = None
    admin_email: Optional[str] = None
    approver_ok: Optional[bool] = None
    missing_role: Optional[str] = None
