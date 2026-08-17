# schemas/problem_statement.py
"""
schemas/problem_statement.py
"""

from typing import Literal

from pydantic import BaseModel, Field


class ProblemStatementRequest(BaseModel):
    title: str = Field(min_length=3, max_length=255)


class ProblemStatementResponse(BaseModel):
    title: str
    problem_statement: str
    generated_by: Literal["gemini", "groq", "unavailable"]
