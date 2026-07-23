from pydantic import BaseModel
from datetime import datetime

class AlternativeCreate(BaseModel):
    title: str
    pros: str | None = None
    cons: str | None = None
    estimated_cost: float | None = None
    risk_assessment: str | None = None

class AlternativeUpdate(BaseModel):
    title: str | None = None
    pros: str | None = None
    cons: str | None = None
    estimated_cost: float | None = None
    risk_assessment: str | None = None

class AlternativeOut(BaseModel):
    id: int
    decision_id: int
    title: str
    pros: str | None
    cons: str | None
    estimated_cost: float | None
    risk_assessment: str | None
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True