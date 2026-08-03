"""
services/report_service.py

Single source of truth for report aggregation. Composes the existing
Decision/Approval/Team/AuditLog/User repositories only — every grouped
COUNT/AVG lives in a repository method (same convention as
DashboardService), so there is no raw SQL and no duplicated aggregation
logic here, only composition and shaping into the report schemas.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ApprovalStatus
from app.repositories.approval_repository import ApprovalRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.decision_repository import DecisionRepository
from app.repositories.team_repository import TeamRepository
from app.repositories.user_repository import UserRepository
from app.schemas.audit_log import AuditLogOut
from app.schemas.decision import DecisionOut
from app.schemas.report import (
    ActionCount,
    ActorActivity,
    ApprovalLevelSummary,
    ApprovalReportOut,
    AuditReportOut,
    CategoryCount,
    DecisionReportOut,
    PeriodCount,
    ReportSummaryOut,
    StatusCount,
    TeamActivitySummary,
    TeamReportOut,
)

# Audit actions that represent authentication/authorization activity
# (see services/auth_service.py, user_service.py) — the Audit Report's
# "security events" section is exactly this subset.
_SECURITY_ACTIONS = (
    "user.registered",
    "user.login",
    "user.password_changed",
    "user.role_changed",
)

_APPROVAL_STATUS_KEYS = ("pending", "approved", "rejected", "escalated")


class ReportService:

    def __init__(
        self,
        db: AsyncSession,
    ) -> None:

        self.db = db

        self.decisions = DecisionRepository(db)
        self.approvals = ApprovalRepository(db)
        self.teams = TeamRepository(db)
        self.audit_logs = AuditLogRepository(db)
        self.users = UserRepository(db)

    # --------------------------------------------------
    # Decision Report
    # --------------------------------------------------

    async def get_decision_report(self) -> DecisionReportOut:

        status_counts = await self.decisions.count_by_status()
        category_counts = await self.decisions.count_by_category()
        period_counts = await self.decisions.count_by_period()
        recent = await self.decisions.list_recent(limit=10)

        return DecisionReportOut(
            total_decisions=sum(status_counts.values()),
            by_status=[
                StatusCount(status=status.value, count=count)
                for status, count in status_counts.items()
            ],
            by_category=[
                CategoryCount(category=category or "Uncategorized", count=count)
                for category, count in category_counts.items()
            ],
            created_over_time=[
                PeriodCount(period=period.date(), count=count)
                for period, count in period_counts.items()
            ],
            recent_decisions=[
                DecisionOut.model_validate(decision)
                for decision in recent
            ],
        )

    # --------------------------------------------------
    # Approval Report
    # --------------------------------------------------

    async def get_approval_report(self) -> ApprovalReportOut:

        status_counts = await self.approvals.count_by_status()
        level_rows = await self.approvals.count_by_level_and_status()
        average_seconds = await self.approvals.average_completion_seconds()

        levels: dict[int, dict[str, int]] = {}

        for level, status, count in level_rows:
            counts = levels.setdefault(
                level,
                {key: 0 for key in _APPROVAL_STATUS_KEYS},
            )
            counts[status.value] = count

        return ApprovalReportOut(
            total_approvals=sum(status_counts.values()),
            pending=status_counts.get(ApprovalStatus.PENDING, 0),
            approved=status_counts.get(ApprovalStatus.APPROVED, 0),
            rejected=status_counts.get(ApprovalStatus.REJECTED, 0),
            escalated=status_counts.get(ApprovalStatus.ESCALATED, 0),
            average_completion_hours=(
                average_seconds / 3600 if average_seconds is not None else None
            ),
            by_level=[
                ApprovalLevelSummary(level=level, **counts)
                for level, counts in sorted(levels.items())
            ],
        )

    # --------------------------------------------------
    # Team Report
    # --------------------------------------------------

    async def get_team_report(self) -> TeamReportOut:

        teams = await self.teams.list_all()
        decision_counts = await self.decisions.count_by_team()
        approval_rows = await self.approvals.count_by_status_per_team()

        approvals_by_team: dict = {}

        for team_id, status, count in approval_rows:
            counts = approvals_by_team.setdefault(
                team_id,
                {key: 0 for key in _APPROVAL_STATUS_KEYS},
            )
            counts[status.value] = count

        team_summaries = [
            TeamActivitySummary(
                team_id=team.id,
                team_name=team.name,
                member_count=len(team.members),
                decision_count=decision_counts.get(team.id, 0),
                pending_approvals=approvals_by_team.get(team.id, {}).get("pending", 0),
                approved_approvals=approvals_by_team.get(team.id, {}).get("approved", 0),
                rejected_approvals=approvals_by_team.get(team.id, {}).get("rejected", 0),
                escalated_approvals=approvals_by_team.get(team.id, {}).get("escalated", 0),
            )
            for team in teams
        ]

        return TeamReportOut(
            total_teams=len(teams),
            teams=team_summaries,
        )

    # --------------------------------------------------
    # Audit Report
    # --------------------------------------------------

    async def get_audit_report(self) -> AuditReportOut:

        action_counts = await self.audit_logs.count_by_action()
        actor_rows = await self.audit_logs.count_by_actor()
        period_counts = await self.audit_logs.count_by_period()
        recent = await self.audit_logs.list_recent(limit=20)
        security_events = await self.audit_logs.list_by_actions(
            _SECURITY_ACTIONS, limit=20
        )

        actor_activity = []

        for actor_id, count in actor_rows:
            user = await self.users.get_by_id(actor_id)
            actor_activity.append(
                ActorActivity(
                    actor_id=actor_id,
                    actor_name=user.full_name if user else "Unknown",
                    count=count,
                )
            )

        return AuditReportOut(
            total_events=sum(action_counts.values()),
            by_action=[
                ActionCount(action=action, count=count)
                for action, count in sorted(action_counts.items())
            ],
            by_actor=sorted(
                actor_activity, key=lambda entry: entry.count, reverse=True
            ),
            security_events=[
                AuditLogOut.model_validate(log) for log in security_events
            ],
            recent_events=[
                AuditLogOut.model_validate(log) for log in recent
            ],
            timeline=[
                PeriodCount(period=period.date(), count=count)
                for period, count in period_counts.items()
            ],
        )

    # --------------------------------------------------
    # Summary
    # --------------------------------------------------

    async def get_summary(self) -> ReportSummaryOut:

        decision_status_counts = await self.decisions.count_by_status()
        approval_status_counts = await self.approvals.count_by_status()
        teams = await self.teams.list_all()
        audit_action_counts = await self.audit_logs.count_by_action()

        return ReportSummaryOut(
            total_decisions=sum(decision_status_counts.values()),
            total_approvals=sum(approval_status_counts.values()),
            pending_approvals=approval_status_counts.get(ApprovalStatus.PENDING, 0),
            total_teams=len(teams),
            total_audit_events=sum(audit_action_counts.values()),
        )
