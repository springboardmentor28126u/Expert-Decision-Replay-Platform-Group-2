from pydantic import BaseModel
from datetime import datetime


class AIReviewOut(BaseModel):
    id: int
    decision_id: int
    problem_status: str
    problem_note: str
    alternatives_status: str
    alternatives_note: str
    cost_status: str
    cost_note: str
    risk_status: str
    risk_note: str
    documents_status: str
    documents_note: str
    overall_summary: str
    requested_by: int
    created_at: datetime

    class Config:
        from_attributes = True