"""
schemas/dashboard.py
"""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.common import ORMBase
from app.schemas.report import CategoryCount, PeriodCount


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


class TopCreator(BaseModel):
    user_id: uuid.UUID
    full_name: str
    decision_count: int


class ApprovalPerformanceCounts(BaseModel):
    pending: int
    approved: int
    rejected: int
    escalated: int


class RecentDecisionActivity(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    created_by_name: str
    created_at: datetime


class RecentApprovalActivity(BaseModel):
    id: uuid.UUID
    decision_id: uuid.UUID
    decision_title: str
    reviewer_name: str
    level: int
    status: str
    updated_at: datetime


class RecentCommentActivity(BaseModel):
    id: uuid.UUID
    decision_id: uuid.UUID
    decision_title: str
    author_name: str
    excerpt: str
    created_at: datetime


class RecentActivityOut(BaseModel):
    decisions: List[RecentDecisionActivity]
    approvals: List[RecentApprovalActivity]
    comments: List[RecentCommentActivity]


class DashboardAnalyticsOut(BaseModel):
    """
    Executive-dashboard aggregates layered onto the existing summary —
    composed entirely from repository methods already used by
    DecisionRepository/ApprovalRepository/UserRepository/CommentRepository
    (see services/report_service.py for the same pattern), so this adds
    no new query shapes beyond count_by_creator/list_recent.
    """
    total_decisions: int
    pending_reviews: int
    approved_decisions: int
    rejected_decisions: int
    active_users: int
    total_comments: int
    by_category: List[CategoryCount]
    created_over_time: List[PeriodCount]
    approval_performance: ApprovalPerformanceCounts
    top_creators: List[TopCreator]
    recent_activity: RecentActivityOut


class DashboardSummaryOut(ORMBase):
    decision_status_counts: DecisionStatusCounts
    admin_stats: Optional[AdminDashboardStats] = None
    analytics: DashboardAnalyticsOut
