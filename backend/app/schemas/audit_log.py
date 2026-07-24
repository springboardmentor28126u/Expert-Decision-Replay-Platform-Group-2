"""
Expert Decision Replay Platform - Audit Log Schemas

Pydantic schemas for audit log responses.
"""

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Any


class AuditLogResponse(BaseModel):
    """Full audit log entry response."""
    id: UUID
    entity_type: str
    entity_id: UUID
    action: str
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    performed_by: UUID
    performer_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
