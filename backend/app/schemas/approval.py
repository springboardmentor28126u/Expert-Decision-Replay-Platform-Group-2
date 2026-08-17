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
    reviewer_name: Optional[str] = None

    assigned_by_id: Optional[int] = None
    assigned_by_name: Optional[str] = None

    status: str
    comments: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime