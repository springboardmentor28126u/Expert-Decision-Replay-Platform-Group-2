"""
Expert Decision Replay Platform - Common Schemas

Shared response schemas used across the API.
"""

from pydantic import BaseModel
from typing import Any, Optional, List


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str
    detail: Optional[str] = None


class PaginatedResponse(BaseModel):
    """Paginated list response wrapper."""
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
    status_code: int
