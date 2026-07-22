from pydantic import BaseModel
from datetime import datetime
from app.models.decision import DecisionStatus

class DecisionCreate(BaseModel):
    title: str
    problem_statement: str
    category: str | None = None

class DecisionUpdate(BaseModel):
    title: str | None = None
    problem_statement: str | None = None
    category: str | None = None
    status: DecisionStatus | None = None

class DecisionOut(BaseModel):
    id: int
    title: str
    problem_statement: str
    category: str | None
    status: DecisionStatus
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True