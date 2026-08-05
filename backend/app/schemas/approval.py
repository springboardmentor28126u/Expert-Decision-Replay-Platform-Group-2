from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ApprovalCreate(BaseModel):
    decision_id: int
    reviewer_id: int
    comments: Optional[str] = None


class ApprovalUpdate(BaseModel):
    comments: Optional[str] = None


class ApprovalResponse(BaseModel):
    id: int
    decision_id: int
    reviewer_id: int
    status: str
    comments: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True