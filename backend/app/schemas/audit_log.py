from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel

from app.schemas.user import UserResponse


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    description: Optional[str] = None
    endpoint: Optional[str] = None
    http_method: Optional[str] = None
    response_status: Optional[int] = None
    ip_address: Optional[str] = None
    created_at: Optional[datetime] = None
    user: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


class AuditLogFilterParams(BaseModel):
    user_id: Optional[int] = None
    action: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    search: Optional[str] = None


class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
