# schemas/approval_intelligence.py
"""
schemas/approval_intelligence.py
"""

import uuid
from typing import Literal

from pydantic import BaseModel


class ApprovalRecommendationOut(BaseModel):
    decision_id: uuid.UUID
    recommendation: Literal["approve", "reject", "needs_review"]
    reasoning: str
    generated_by: Literal["gemini", "groq", "deterministic"]
