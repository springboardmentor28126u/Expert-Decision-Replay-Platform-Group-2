# schemas/decision_summary.py
"""
schemas/decision_summary.py
"""

import uuid
from typing import Literal, Optional

from pydantic import BaseModel


class ApprovalProgressEntry(BaseModel):
    level: int
    reviewer_name: str
    status: str
    comments: Optional[str] = None


class DecisionSummaryOut(BaseModel):
    decision_id: uuid.UUID
    title: str
    status: str
    category: Optional[str] = None
    summary: str
    generated_by: Literal["gemini", "deterministic"]
    total_alternatives: int
    selected_alternative: Optional[str] = None
    approval_progress: list[ApprovalProgressEntry]
    revision_count: int
    total_comments: int
