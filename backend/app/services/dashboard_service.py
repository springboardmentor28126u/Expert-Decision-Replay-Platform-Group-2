"""
services/dashboard_service.py

Business logic for the Dashboard summary.

One generic summary composed from existing repositories rather than
role-specific endpoints — every authenticated user gets the org-wide
decision status counts; Administrators additionally get the user/role
breakdown. No new queries beyond small aggregate additions on
DecisionRepository/UserRepository; AlternativeRepository's count is
the one it already inherits from BaseRepository.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ApprovalStatus, DecisionStatus, RoleName
from app.models.user import User
from app.repositories.alternative_repository import AlternativeRepository
from app.repositories.approval_repository import ApprovalRepository
from app.repositories.comment_repository import CommentRepository
from app.repositories.decision_repository import DecisionRepository
from app.repositories.user_repository import UserRepository
from app.schemas.dashboard import (
    AdminDashboardStats,
    ApprovalPerformanceCounts,
    DashboardAnalyticsOut,
    DashboardSummaryOut,
    DecisionStatusCounts,
    RecentActivityOut,
    RecentApprovalActivity,
    RecentCommentActivity,
    RecentDecisionActivity,
    TopCreator,
    UserRoleCounts,
)
from app.schemas.report import CategoryCount, PeriodCount

_ACTIVITY_FEED_SIZE = 5
_TOP_CREATORS_SIZE = 5


class DashboardService:

    def __init__(
        self,
        db: AsyncSession,
    ) -> None:

        self.db = db

        self.decisions = DecisionRepository(db)
        self.users = UserRepository(db)
        self.alternatives = AlternativeRepository(db)
        self.approvals = ApprovalRepository(db)
        self.comments = CommentRepository(db)

    async def get_summary(
        self,
        current_user: User,
    ) -> DashboardSummaryOut:

        status_counts = await self.decisions.count_by_status()

        decision_status_counts = DecisionStatusCounts(
            draft=status_counts.get(DecisionStatus.DRAFT, 0),
            under_review=status_counts.get(DecisionStatus.UNDER_REVIEW, 0),
            approved=status_counts.get(DecisionStatus.APPROVED, 0),
            rejected=status_counts.get(DecisionStatus.REJECTED, 0),
            archived=status_counts.get(DecisionStatus.ARCHIVED, 0),
            total=sum(status_counts.values()),
        )

        admin_stats = None

        if current_user.role.name == RoleName.ADMINISTRATOR.value:
            admin_stats = await self._get_admin_stats()

        analytics = await self._get_analytics(decision_status_counts)

        return DashboardSummaryOut(
            decision_status_counts=decision_status_counts,
            admin_stats=admin_stats,
            analytics=analytics,
        )

    async def _get_analytics(
        self,
        decision_status_counts: DecisionStatusCounts,
    ) -> DashboardAnalyticsOut:
        """
        Executive-dashboard aggregates. Every figure here is a grouped
        COUNT or a small LIMITed list from a repository — same composition
        pattern as ReportService, just surfaced on the summary every
        authenticated user already calls instead of behind the
        Manager/Administrator-only Reports module.
        """

        approval_status_counts = await self.approvals.count_by_status()
        category_counts = await self.decisions.count_by_category()
        period_counts = await self.decisions.count_by_period(granularity="month")
        active_users = await self.users.count_active()
        total_comments = await self.comments.count()
        creator_rows = await self.decisions.count_by_creator(limit=_TOP_CREATORS_SIZE)

        recent_decisions = await self.decisions.list_recent(limit=_ACTIVITY_FEED_SIZE)
        recent_approvals = await self.approvals.list_recent(limit=_ACTIVITY_FEED_SIZE)
        recent_comments = await self.comments.list_recent(limit=_ACTIVITY_FEED_SIZE)

        return DashboardAnalyticsOut(
            total_decisions=decision_status_counts.total,
            pending_reviews=approval_status_counts.get(ApprovalStatus.PENDING, 0),
            approved_decisions=decision_status_counts.approved,
            rejected_decisions=decision_status_counts.rejected,
            active_users=active_users,
            total_comments=total_comments,
            by_category=[
                CategoryCount(category=category or "Uncategorized", count=count)
                for category, count in category_counts.items()
            ],
            created_over_time=[
                PeriodCount(period=period.date(), count=count)
                for period, count in period_counts.items()
            ],
            approval_performance=ApprovalPerformanceCounts(
                pending=approval_status_counts.get(ApprovalStatus.PENDING, 0),
                approved=approval_status_counts.get(ApprovalStatus.APPROVED, 0),
                rejected=approval_status_counts.get(ApprovalStatus.REJECTED, 0),
                escalated=approval_status_counts.get(ApprovalStatus.ESCALATED, 0),
            ),
            top_creators=[
                TopCreator(user_id=user_id, full_name=full_name, decision_count=count)
                for user_id, full_name, count in creator_rows
            ],
            recent_activity=RecentActivityOut(
                decisions=[
                    RecentDecisionActivity(
                        id=d.id,
                        title=d.title,
                        status=d.status.value,
                        created_by_name=d.created_by.full_name if d.created_by else "Unknown",
                        created_at=d.created_at,
                    )
                    for d in recent_decisions
                ],
                approvals=[
                    RecentApprovalActivity(
                        id=a.id,
                        decision_id=a.decision_id,
                        decision_title=a.decision.title if a.decision else "Unknown",
                        reviewer_name=a.reviewer.full_name if a.reviewer else "Unknown",
                        level=a.level,
                        status=a.status.value,
                        updated_at=a.updated_at,
                    )
                    for a in recent_approvals
                ],
                comments=[
                    RecentCommentActivity(
                        id=c.id,
                        decision_id=c.decision_id,
                        decision_title=c.decision.title if c.decision else "Unknown",
                        author_name=c.author.full_name if c.author else "Unknown",
                        excerpt=(c.content[:140] + "…") if len(c.content) > 140 else c.content,
                        created_at=c.created_at,
                    )
                    for c in recent_comments
                ],
            ),
        )

    async def _get_admin_stats(self) -> AdminDashboardStats:

        total_users = await self.users.count()
        active_users = await self.users.count_active()
        role_counts = await self.users.count_by_role()
        total_alternatives = await self.alternatives.count()

        return AdminDashboardStats(
            total_users=total_users,
            active_users=active_users,
            users_by_role=UserRoleCounts(
                employee=role_counts.get(RoleName.EMPLOYEE.value, 0),
                reviewer=role_counts.get(RoleName.REVIEWER.value, 0),
                manager=role_counts.get(RoleName.MANAGER.value, 0),
                administrator=role_counts.get(RoleName.ADMINISTRATOR.value, 0),
            ),
            total_alternatives=total_alternatives,
        )
