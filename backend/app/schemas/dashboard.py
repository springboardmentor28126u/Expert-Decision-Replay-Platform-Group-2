"""
schemas/dashboard.py
"""

from typing import Optional

from app.schemas.common import ORMBase


class DecisionStatusCounts(ORMBase):
    draft: int
    under_review: int
    approved: int
    rejected: int
    archived: int
    total: int


class UserRoleCounts(ORMBase):
    employee: int
    reviewer: int
    manager: int
    administrator: int


class AdminDashboardStats(ORMBase):
    """
    Administrator-only figures. Only populated on DashboardSummaryOut
    when the requesting user holds the Administrator role — see
    DashboardService.get_summary.
    """
    total_users: int
    active_users: int
    users_by_role: UserRoleCounts
    total_alternatives: int


class DashboardSummaryOut(ORMBase):
    decision_status_counts: DecisionStatusCounts
    admin_stats: Optional[AdminDashboardStats] = None
