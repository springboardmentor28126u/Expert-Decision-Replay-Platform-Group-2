"""
Expert Decision Replay Platform - Decision Version Schemas

Pydantic schemas for version history operations.
"""

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Any


class DecisionVersionResponse(BaseModel):
    """Schema for decision version in API responses."""
    id: UUID
    decision_id: UUID
    version_number: int
    snapshot_json: Any  # Full decision state as JSON
    change_summary: Optional[str] = None
    created_by: UUID
    creator_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
