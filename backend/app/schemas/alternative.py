"""Alternative schemas."""

from typing import Optional

from pydantic import BaseModel, Field


class AlternativeCreate(BaseModel):
    """Schema for creating an alternative."""
    name: str = Field(..., min_length=1, max_length=255)
    pros: Optional[str] = None
    cons: Optional[str] = None
    cost: Optional[int] = Field(None, ge=0, le=10)
    quality: Optional[int] = Field(None, ge=0, le=10)
    risk: Optional[int] = Field(None, ge=0, le=10)
    feasibility: Optional[int] = Field(None, ge=0, le=10)


class AlternativeUpdate(BaseModel):
    """Schema for updating an alternative."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    pros: Optional[str] = None
    cons: Optional[str] = None
    cost: Optional[int] = Field(None, ge=0, le=10)
    quality: Optional[int] = Field(None, ge=0, le=10)
    risk: Optional[int] = Field(None, ge=0, le=10)
    feasibility: Optional[int] = Field(None, ge=0, le=10)


class AlternativeResponse(BaseModel):
    """Schema for alternative response."""
    id: int
    decision_id: Optional[int] = None
    name: str
    pros: Optional[str] = None
    cons: Optional[str] = None
    cost: Optional[int] = None
    quality: Optional[int] = None
    risk: Optional[int] = None
    feasibility: Optional[int] = None

    model_config = {"from_attributes": True}
