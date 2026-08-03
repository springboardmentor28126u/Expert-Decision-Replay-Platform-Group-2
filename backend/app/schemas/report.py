"""
schemas/report.py

Output-only schemas for the Reports module. Nothing here is written
back through an API — reports are read/exported, never created — so,
like schemas/audit_log.py, there is intentionally no *Create/*Update
variant.

Where an existing schema already shapes the data correctly
(DecisionOut for recent decisions, AuditLogOut for recent/security
events), it's reused directly rather than re-declared here.
"""

import uuid
from datetime import date
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.audit_log import AuditLogOut
from app.schemas.decision import DecisionOut


class StatusCount(BaseModel):
    status: str
    count: int


class CategoryCount(BaseModel):
    category: str
    count: int


class PeriodCount(BaseModel):
    period: date
    count: int


class DecisionReportOut(BaseModel):
    total_decisions: int
    by_status: List[StatusCount]
    by_category: List[CategoryCount]
    created_over_time: List[PeriodCount]
    recent_decisions: List[DecisionOut]


class ApprovalLevelSummary(BaseModel):
    level: int
    pending: int
    approved: int
    rejected: int
    escalated: int


class ApprovalReportOut(BaseModel):
    total_approvals: int
    pending: int
    approved: int
    rejected: int
    escalated: int
    # None when no approval has ever been decided yet — nothing to average.
    average_completion_hours: Optional[float] = None
    by_level: List[ApprovalLevelSummary]


class TeamActivitySummary(BaseModel):
    team_id: uuid.UUID
    team_name: str
    member_count: int
    decision_count: int
    pending_approvals: int
    approved_approvals: int
    rejected_approvals: int
    escalated_approvals: int


class TeamReportOut(BaseModel):
    total_teams: int
    teams: List[TeamActivitySummary]


class ActionCount(BaseModel):
    action: str
    count: int


class ActorActivity(BaseModel):
    actor_id: uuid.UUID
    actor_name: str
    count: int


class AuditReportOut(BaseModel):
    total_events: int
    by_action: List[ActionCount]
    by_actor: List[ActorActivity]
    security_events: List[AuditLogOut]
    recent_events: List[AuditLogOut]
    timeline: List[PeriodCount]


class ReportSummaryOut(BaseModel):
    total_decisions: int
    total_approvals: int
    pending_approvals: int
    total_teams: int
    total_audit_events: int
