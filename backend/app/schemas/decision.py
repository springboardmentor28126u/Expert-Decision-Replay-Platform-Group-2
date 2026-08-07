from pydantic import BaseModel
from datetime import datetime


class DecisionCreate(BaseModel):
    title: str
    description: str
    category: str

class DecisionUpdate(BaseModel):
    title: str
    description: str
    category: str
    status: str

class DecisionResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    status: str
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True