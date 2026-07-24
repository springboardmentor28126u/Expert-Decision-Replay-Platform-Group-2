"""
schemas/decision.py
"""

import uuid
from datetime import datetime
from typing import Optional
from app.schemas.decision_version import DecisionVersionOut
from pydantic import BaseModel, Field

from app.models.enums import DecisionStatus
from app.schemas.common import ORMBase


class DecisionBase(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    problem_statement: str = Field(min_length=1)
    category: Optional[str] = Field(default=None, max_length=100)


class DecisionCreate(DecisionBase):
    team_id: Optional[uuid.UUID] = None


class DecisionUpdate(BaseModel):
    """
    PATCH semantics. Notably excludes `status` — status transitions go
    through the dedicated DecisionStatusUpdate schema and workflow rules
    (e.g. only a Reviewer/Manager can move UNDER_REVIEW -> APPROVED),
    not a generic field update.
    """
    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    problem_statement: Optional[str] = None
    category: Optional[str] = Field(default=None, max_length=100)
    decision_rationale: Optional[str] = None
    team_id: Optional[uuid.UUID] = None


class DecisionStatusUpdate(BaseModel):
    """
    Dedicated schema for explicit status transitions
    (PATCH /decisions/{id}/status), kept separate from DecisionUpdate so
    routers/services can apply workflow validation (allowed transitions,
    required approval state) distinctly from a plain content edit.
    """
    status: DecisionStatus
    reason: Optional[str] = Field(default=None, max_length=1000)


class DecisionCreatorSummary(ORMBase):
    id: uuid.UUID
    full_name: str
    email: str


class DecisionOut(ORMBase):
    id: uuid.UUID
    title: str
    problem_statement: str
    category: Optional[str] = None
    decision_rationale: Optional[str] = None
    status: DecisionStatus
    version: int
    team_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    created_by: DecisionCreatorSummary

class DecisionVersionListOut(ORMBase):
    decision_id: uuid.UUID
    versions: list[DecisionVersionOut]
