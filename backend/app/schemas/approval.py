from pydantic import BaseModel
from datetime import datetime

class ApprovalCreate(BaseModel):
    decision_outcome: str
    remarks: str | None = None

class ApprovalOut(BaseModel):
    id: int
    decision_id: int
    reviewer_id: int
    decision_outcome: str
    remarks: str | None
    reviewed_at: datetime

    class Config:
        from_attributes = True