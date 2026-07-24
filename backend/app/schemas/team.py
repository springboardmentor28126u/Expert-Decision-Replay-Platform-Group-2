# schemas/team.py
"""
schemas/team.py
"""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class TeamBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: Optional[str] = None


class TeamCreate(TeamBase):
    manager_id: Optional[uuid.UUID] = None


class TeamUpdate(BaseModel):
    """All fields optional — PATCH semantics, only supplied fields are applied."""
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    description: Optional[str] = None
    manager_id: Optional[uuid.UUID] = None


class TeamMemberAssign(BaseModel):
    """Body for POST /teams/{team_id}/members — replaces the old bare query param."""
    user_id: uuid.UUID


class TeamMemberSummary(ORMBase):
    """Lightweight nested representation to avoid a full UserOut cycle."""
    id: uuid.UUID
    full_name: str
    email: str


class TeamOut(ORMBase):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    manager_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime


class TeamDetailOut(TeamOut):
    """Used on GET /teams/{team_id} — includes the member roster."""
    manager: Optional[TeamMemberSummary] = None
    members: List[TeamMemberSummary] = []

