"""
services/report_export_service.py

Renders ReportService's already-aggregated output to PDF (ReportLab)
and XLSX (openpyxl).

This service does no aggregation, no repository queries, and no
business logic of its own — every number it renders was already
computed by ReportService. Its only job is formatting.
"""

from __future__ import annotations

import io
from typing import List, Literal

from openpyxl import Workbook
from openpyxl.styles import Font
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.schemas.report import (
    ApprovalReportOut,
    AuditReportOut,
    DecisionReportOut,
    TeamReportOut,
)
from app.services.report_service import ReportService

ReportName = Literal["decision", "approval", "team", "audit"]

_HEADER_BG = colors.HexColor("#2E3646")
_GRID_COLOR = colors.HexColor("#B5BAC4")


class ReportExportService:

    def __init__(
        self,
        report_service: ReportService,
    ) -> None:
        self.reports = report_service

    # --------------------------------------------------
    # Public entry points
    # --------------------------------------------------

    async def export_pdf(self, report_name: ReportName) -> bytes:

        if report_name == "decision":
            return self._decision_pdf(await self.reports.get_decision_report())
        if report_name == "approval":
            return self._approval_pdf(await self.reports.get_approval_report())
        if report_name == "team":
            return self._team_pdf(await self.reports.get_team_report())
        if report_name == "audit":
            return self._audit_pdf(await self.reports.get_audit_report())

        raise ValueError(f"Unknown report: {report_name}")

    async def export_excel(self, report_name: ReportName) -> bytes:

        if report_name == "decision":
            return self._decision_excel(await self.reports.get_decision_report())
        if report_name == "approval":
            return self._approval_excel(await self.reports.get_approval_report())
        if report_name == "team":
            return self._team_excel(await self.reports.get_team_report())
        if report_name == "audit":
            return self._audit_excel(await self.reports.get_audit_report())

        raise ValueError(f"Unknown report: {report_name}")

    # --------------------------------------------------
    # Shared PDF helpers
    # --------------------------------------------------

    def _table(self, headers: List[str], rows: List[list]) -> Table:
        data = [headers] + (rows or [["—"] + [""] * (len(headers) - 1)])
        table = Table(data, hAlign="LEFT")
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), _HEADER_BG),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("GRID", (0, 0), (-1, -1), 0.5, _GRID_COLOR),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F5F7")]),
                ]
            )
        )
        return table

    def _build_pdf(self, title: str, story: list) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, title=title)
        styles = getSampleStyleSheet()

        document = [Paragraph(title, styles["Title"]), Spacer(1, 16), *story]
        doc.build(document)

        return buffer.getvalue()

    def _section(self, styles, heading: str, table: Table) -> list:
        return [Paragraph(heading, styles["Heading3"]), Spacer(1, 6), table, Spacer(1, 14)]

    # --------------------------------------------------
    # Decision Report
    # --------------------------------------------------

    def _decision_pdf(self, data: DecisionReportOut) -> bytes:
        styles = getSampleStyleSheet()

        story = [
            Paragraph(f"Total Decisions: {data.total_decisions}", styles["Heading2"]),
            Spacer(1, 12),
            *self._section(
                styles, "By Status",
                self._table(["Status", "Count"], [[s.status, s.count] for s in data.by_status]),
            ),
            *self._section(
                styles, "By Category",
                self._table(["Category", "Count"], [[c.category, c.count] for c in data.by_category]),
            ),
            *self._section(
                styles, "Created Over Time",
                self._table(["Date", "Count"], [[p.period.isoformat(), p.count] for p in data.created_over_time]),
            ),
            *self._section(
                styles, "Recent Decisions",
                self._table(
                    ["Title", "Status", "Category", "Created"],
                    [
                        [d.title, d.status.value, d.category or "-", d.created_at.strftime("%Y-%m-%d")]
                        for d in data.recent_decisions
                    ],
                ),
            ),
        ]

        return self._build_pdf("Decision Report", story)

    def _decision_excel(self, data: DecisionReportOut) -> bytes:
        return self._workbook(
            {
                "Summary": (["Metric", "Value"], [["Total Decisions", data.total_decisions]]),
                "By Status": (["Status", "Count"], [[s.status, s.count] for s in data.by_status]),
                "By Category": (["Category", "Count"], [[c.category, c.count] for c in data.by_category]),
                "Over Time": (["Date", "Count"], [[p.period.isoformat(), p.count] for p in data.created_over_time]),
                "Recent Decisions": (
                    ["Title", "Status", "Category", "Created"],
                    [
                        [d.title, d.status.value, d.category or "-", d.created_at.strftime("%Y-%m-%d")]
                        for d in data.recent_decisions
                    ],
                ),
            }
        )

    # --------------------------------------------------
    # Approval Report
    # --------------------------------------------------

    def _approval_pdf(self, data: ApprovalReportOut) -> bytes:
        styles = getSampleStyleSheet()
        avg = f"{data.average_completion_hours:.1f} hours" if data.average_completion_hours is not None else "N/A"

        story = [
            Paragraph(f"Total Approvals: {data.total_approvals}", styles["Heading2"]),
            Paragraph(f"Average Completion Time: {avg}", styles["Normal"]),
            Spacer(1, 12),
            *self._section(
                styles, "By Status",
                self._table(
                    ["Status", "Count"],
                    [
                        ["Pending", data.pending],
                        ["Approved", data.approved],
                        ["Rejected", data.rejected],
                        ["Escalated", data.escalated],
                    ],
                ),
            ),
            *self._section(
                styles, "Multi-Level Summary",
                self._table(
                    ["Level", "Pending", "Approved", "Rejected", "Escalated"],
                    [[lv.level, lv.pending, lv.approved, lv.rejected, lv.escalated] for lv in data.by_level],
                ),
            ),
        ]

        return self._build_pdf("Approval Report", story)

    def _approval_excel(self, data: ApprovalReportOut) -> bytes:
        avg = round(data.average_completion_hours, 2) if data.average_completion_hours is not None else "N/A"

        return self._workbook(
            {
                "Summary": (
                    ["Metric", "Value"],
                    [
                        ["Total Approvals", data.total_approvals],
                        ["Pending", data.pending],
                        ["Approved", data.approved],
                        ["Rejected", data.rejected],
                        ["Escalated", data.escalated],
                        ["Average Completion (hours)", avg],
                    ],
                ),
                "By Level": (
                    ["Level", "Pending", "Approved", "Rejected", "Escalated"],
                    [[lv.level, lv.pending, lv.approved, lv.rejected, lv.escalated] for lv in data.by_level],
                ),
            }
        )

    # --------------------------------------------------
    # Team Report
    # --------------------------------------------------

    def _team_pdf(self, data: TeamReportOut) -> bytes:
        styles = getSampleStyleSheet()

        story = [
            Paragraph(f"Total Teams: {data.total_teams}", styles["Heading2"]),
            Spacer(1, 12),
            *self._section(
                styles, "Team Activity",
                self._table(
                    ["Team", "Members", "Decisions", "Pending", "Approved", "Rejected", "Escalated"],
                    [
                        [
                            t.team_name, t.member_count, t.decision_count,
                            t.pending_approvals, t.approved_approvals,
                            t.rejected_approvals, t.escalated_approvals,
                        ]
                        for t in data.teams
                    ],
                ),
            ),
        ]

        return self._build_pdf("Team Report", story)

    def _team_excel(self, data: TeamReportOut) -> bytes:
        return self._workbook(
            {
                "Teams": (
                    ["Team", "Members", "Decisions", "Pending", "Approved", "Rejected", "Escalated"],
                    [
                        [
                            t.team_name, t.member_count, t.decision_count,
                            t.pending_approvals, t.approved_approvals,
                            t.rejected_approvals, t.escalated_approvals,
                        ]
                        for t in data.teams
                    ],
                ),
            }
        )

    # --------------------------------------------------
    # Audit Report
    # --------------------------------------------------

    def _audit_pdf(self, data: AuditReportOut) -> bytes:
        styles = getSampleStyleSheet()

        story = [
            Paragraph(f"Total Audit Events: {data.total_events}", styles["Heading2"]),
            Spacer(1, 12),
            *self._section(
                styles, "By Type",
                self._table(["Action", "Count"], [[a.action, a.count] for a in data.by_action]),
            ),
            *self._section(
                styles, "User Activity",
                self._table(["User", "Events"], [[a.actor_name, a.count] for a in data.by_actor]),
            ),
            *self._section(
                styles, "Timeline",
                self._table(["Date", "Count"], [[p.period.isoformat(), p.count] for p in data.timeline]),
            ),
            *self._section(
                styles, "Security Events",
                self._table(
                    ["Action", "Actor", "When"],
                    [
                        [e.action, e.actor.full_name if e.actor else "Unknown", e.created_at.strftime("%Y-%m-%d %H:%M")]
                        for e in data.security_events
                    ],
                ),
            ),
            *self._section(
                styles, "Recent Events",
                self._table(
                    ["Action", "Entity", "Actor", "When"],
                    [
                        [
                            e.action, e.entity_type,
                            e.actor.full_name if e.actor else "Unknown",
                            e.created_at.strftime("%Y-%m-%d %H:%M"),
                        ]
                        for e in data.recent_events
                    ],
                ),
            ),
        ]

        return self._build_pdf("Audit Report", story)

    def _audit_excel(self, data: AuditReportOut) -> bytes:
        return self._workbook(
            {
                "By Type": (["Action", "Count"], [[a.action, a.count] for a in data.by_action]),
                "User Activity": (["User", "Events"], [[a.actor_name, a.count] for a in data.by_actor]),
                "Timeline": (["Date", "Count"], [[p.period.isoformat(), p.count] for p in data.timeline]),
                "Security Events": (
                    ["Action", "Actor", "When"],
                    [
                        [e.action, e.actor.full_name if e.actor else "Unknown", e.created_at.strftime("%Y-%m-%d %H:%M")]
                        for e in data.security_events
                    ],
                ),
                "Recent Events": (
                    ["Action", "Entity", "Actor", "When"],
                    [
                        [
                            e.action, e.entity_type,
                            e.actor.full_name if e.actor else "Unknown",
                            e.created_at.strftime("%Y-%m-%d %H:%M"),
                        ]
                        for e in data.recent_events
                    ],
                ),
            }
        )

    # --------------------------------------------------
    # Shared Excel helper
    # --------------------------------------------------

    def _workbook(self, sheets: dict) -> bytes:
        workbook = Workbook()
        workbook.remove(workbook.active)

        for name, (headers, rows) in sheets.items():
            sheet = workbook.create_sheet(title=name[:31])
            sheet.append(headers)

            for cell in sheet[1]:
                cell.font = Font(bold=True)

            for row in rows:
                sheet.append(row)

        buffer = io.BytesIO()
        workbook.save(buffer)

        return buffer.getvalue()
