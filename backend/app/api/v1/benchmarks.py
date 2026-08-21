"""
Expert Decision Replay Platform - Benchmark API Routes

Endpoints for decision benchmarking and category trend analytics.
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.session import get_db
from app.schemas.benchmark import (
    BenchmarkRequest,
    BenchmarkResponse,
    CategoryTrendsResponse,
)
from app.services.benchmark_service import BenchmarkService
from app.api.deps import require_company_role, CompanyContext
from app.models.membership import CompanyRole

router = APIRouter()


@router.post("/benchmark", response_model=BenchmarkResponse)
def get_decision_benchmark(
    data: BenchmarkRequest,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(
        CompanyRole.ADMIN, CompanyRole.MANAGER, CompanyRole.EMPLOYEE,
    )),
):
    """Compute benchmark statistics for a decision in the given category."""
    result = BenchmarkService.compute_benchmark(
        db, ctx.company_id, data.category_id, data.financial_impact,
    )
    return result


@router.get("/benchmarks/category-trends", response_model=CategoryTrendsResponse)
def get_category_trends(
    months: int = 12,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(
        CompanyRole.ADMIN, CompanyRole.MANAGER,
    )),
):
    """Get per-category trend data for the analytics view."""
    trends = BenchmarkService.compute_category_trends(db, ctx.company_id, months)
    return CategoryTrendsResponse(
        trends=trends,
        months_covered=months,
    )
