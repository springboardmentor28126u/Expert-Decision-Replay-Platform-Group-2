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

from app.models.enums import DecisionStatus, RoleName
from app.models.user import User
from app.repositories.alternative_repository import AlternativeRepository
from app.repositories.decision_repository import DecisionRepository
from app.repositories.user_repository import UserRepository
from app.schemas.dashboard import (
    AdminDashboardStats,
    DashboardSummaryOut,
    DecisionStatusCounts,
    UserRoleCounts,
)


class DashboardService:

    def __init__(
        self,
        db: AsyncSession,
    ) -> None:

        self.db = db

        self.decisions = DecisionRepository(db)
        self.users = UserRepository(db)
        self.alternatives = AlternativeRepository(db)

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

        return DashboardSummaryOut(
            decision_status_counts=decision_status_counts,
            admin_stats=admin_stats,
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
