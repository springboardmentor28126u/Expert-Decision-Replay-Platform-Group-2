"""
Expert Decision Replay Platform - Notification Schemas
"""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    title: str
    message: str
    payload: Optional[dict[str, Any]] = None
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
