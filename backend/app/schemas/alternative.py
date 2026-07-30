from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# -----------------------------
# Create Alternative
# -----------------------------
class AlternativeCreate(BaseModel):
    decision_id: int
    title: str
    description: str
    pros: Optional[str] = None
    cons: Optional[str] = None
    score: Optional[float] = 0.0


# -----------------------------
# Update Alternative
# -----------------------------
class AlternativeUpdate(BaseModel):
    title: str
    description: str
    pros: Optional[str] = None
    cons: Optional[str] = None
    score: Optional[float] = 0.0


# -----------------------------
# Alternative Response
# -----------------------------
class AlternativeResponse(BaseModel):
    id: int
    decision_id: int
    title: str
    description: str
    pros: Optional[str]
    cons: Optional[str]
    score: float
    created_at: datetime

    class Config:
        from_attributes = True