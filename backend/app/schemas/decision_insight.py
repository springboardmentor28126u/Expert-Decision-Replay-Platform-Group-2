# schemas/decision_insight.py
"""
schemas/decision_insight.py
"""

import uuid
from typing import Literal, Optional

from pydantic import BaseModel, Field


class SimilarDecisionOut(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    category: Optional[str] = None


class AskDecisionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)


class AskDecisionResponse(BaseModel):
    decision_id: uuid.UUID
    question: str
    answer: str
    generated_by: Literal["gemini", "unavailable"]
