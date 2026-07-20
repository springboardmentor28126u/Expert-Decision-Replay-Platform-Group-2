"""Version history schemas."""

from datetime import datetime
from typing import Optional, Any, Dict

from pydantic import BaseModel

from app.schemas.user import UserResponse


class VersionResponse(BaseModel):
    """Schema for version history response."""
    id: int
    decision_id: Optional[int] = None
    old_title: Optional[str] = None
    old_description: Optional[str] = None
    changed_fields: Optional[Dict[str, Any]] = None
    updated_by: Optional[int] = None
    updated_at: Optional[datetime] = None
    updater: Optional[UserResponse] = None

    model_config = {"from_attributes": True}
