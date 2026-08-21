"""
Expert Decision Replay Platform - Benchmark Schemas

Pydantic schemas for decision benchmarking and analytics.
"""

from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID


class BenchmarkRequest(BaseModel):
    """Request to compute a benchmark for a decision."""
    category_id: UUID
    financial_impact: Optional[float] = None


class BenchmarkResponse(BaseModel):
    """Response containing benchmark statistics for a decision."""
    insufficient_data: bool
    similar_decision_count: int
    avg_cost: Optional[float] = None
    avg_approval_days: Optional[float] = None
    avg_alternatives: Optional[float] = None
    rejection_rate: Optional[float] = None
    current_cost: Optional[float] = None
    delta_pct: Optional[float] = None


class CategoryTrendItem(BaseModel):
    """One category's trend data."""
    category_id: str
    category_name: str
    decision_count: int
    avg_cost: float
    rejection_rate: float
    approved_count: int
    rejected_count: int


class CategoryTrendsResponse(BaseModel):
    """Response containing category trend data."""
    trends: List[CategoryTrendItem]
    months_covered: int
