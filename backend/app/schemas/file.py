"""File attachment schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.user import UserResponse


class FileResponse(BaseModel):
    """Schema for file attachment response."""
    id: int
    decision_id: int
    filename: str
    content_type: Optional[str] = None
    size_bytes: Optional[int] = None
    uploaded_by: Optional[int] = None
    created_at: Optional[datetime] = None
    uploader: Optional[UserResponse] = None

    model_config = {"from_attributes": True}
