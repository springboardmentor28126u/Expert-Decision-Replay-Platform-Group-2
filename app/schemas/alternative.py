"""
schemas/alternative.py
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class AlternativeBase(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    cost_estimate: Optional[Decimal] = Field(default=None, ge=0)
    feasibility_score: Optional[int] = Field(default=None, ge=1, le=10)
    risk_assessment: Optional[str] = None


class AlternativeCreate(AlternativeBase):
    pass


class AlternativeUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    description: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    cost_estimate: Optional[Decimal] = Field(default=None, ge=0)
    feasibility_score: Optional[int] = Field(default=None, ge=1, le=10)
    risk_assessment: Optional[str] = None


class AlternativeSelect(BaseModel):
    """
    POST /decisions/{id}/alternatives/{alt_id}/select — marks this
    alternative as the chosen one. Kept as its own tiny action schema
    rather than folded into AlternativeUpdate, since "select the winning
    option" is a workflow event (and should clear is_selected on
    sibling alternatives), not a plain field edit.
    """
    is_selected: bool = True


class AlternativeOut(ORMBase):
    id: uuid.UUID
    decision_id: uuid.UUID
    title: str
    description: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    cost_estimate: Optional[Decimal] = None
    feasibility_score: Optional[int] = None
    risk_assessment: Optional[str] = None
    is_selected: bool
    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
