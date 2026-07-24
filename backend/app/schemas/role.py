"""
schemas/role.py
"""

import uuid
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class RoleOut(ORMBase):
    id: uuid.UUID
    name: str
    description: Optional[str] = None


class RoleCreate(BaseModel):
    """
    Admin-only: create a new role. Exists mainly for future
    extensibility (org-specific roles) — the four seed roles (employee,
    reviewer, manager, administrator) are created via init_db seeding,
    not this endpoint, in the normal course of operation.
    """
    name: str = Field(min_length=2, max_length=50)
    description: Optional[str] = Field(default=None, max_length=255)

