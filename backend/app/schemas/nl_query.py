# schemas/nl_query.py
"""
schemas/nl_query.py
"""

from typing import Any, Literal

from pydantic import BaseModel, Field


class NLQueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)


class NLQueryResponse(BaseModel):
    question: str
    intent: str
    answer: str
    data: Any
    interpreted_by: Literal["gemini", "deterministic"]
