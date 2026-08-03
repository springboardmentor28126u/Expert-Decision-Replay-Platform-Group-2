"""
routers/report.py

Thin HTTP layer: parse the request, call ReportService/ReportExportService,
shape the response. No aggregation, no formatting logic here — see
services/report_service.py and services/report_export_service.py.

Every endpoint in this router requires Manager or Administrator —
applied once at the router level since it's uniform across all of them,
rather than repeating the same dependency on all thirteen routes.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import require_role
from app.models.enums import RoleName
from app.schemas.report import (
    ApprovalReportOut,
    AuditReportOut,
    DecisionReportOut,
    ReportSummaryOut,
    TeamReportOut,
)
from app.services.report_export_service import ReportExportService
from app.services.report_service import ReportService

router = APIRouter(
    dependencies=[Depends(require_role(RoleName.MANAGER, RoleName.ADMINISTRATOR))],
)


def get_report_service(
    db: AsyncSession = Depends(get_db),
) -> ReportService:
    return ReportService(db)


def get_report_export_service(
    service: ReportService = Depends(get_report_service),
) -> ReportExportService:
    return ReportExportService(service)


def _pdf_response(content: bytes, filename: str) -> Response:
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _excel_response(content: bytes, filename: str) -> Response:
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# --------------------------------------------------
# JSON reports
# --------------------------------------------------


@router.get("/summary", response_model=ReportSummaryOut)
async def get_summary(
    service: ReportService = Depends(get_report_service),
):
    return await service.get_summary()


@router.get("/decision", response_model=DecisionReportOut)
async def get_decision_report(
    service: ReportService = Depends(get_report_service),
):
    return await service.get_decision_report()


@router.get("/approval", response_model=ApprovalReportOut)
async def get_approval_report(
    service: ReportService = Depends(get_report_service),
):
    return await service.get_approval_report()


@router.get("/team", response_model=TeamReportOut)
async def get_team_report(
    service: ReportService = Depends(get_report_service),
):
    return await service.get_team_report()


@router.get("/audit", response_model=AuditReportOut)
async def get_audit_report(
    service: ReportService = Depends(get_report_service),
):
    return await service.get_audit_report()


# --------------------------------------------------
# PDF exports
# --------------------------------------------------


@router.get("/decision/export/pdf")
async def export_decision_pdf(
    service: ReportExportService = Depends(get_report_export_service),
):
    content = await service.export_pdf("decision")
    return _pdf_response(content, "decision_report.pdf")


@router.get("/approval/export/pdf")
async def export_approval_pdf(
    service: ReportExportService = Depends(get_report_export_service),
):
    content = await service.export_pdf("approval")
    return _pdf_response(content, "approval_report.pdf")


@router.get("/team/export/pdf")
async def export_team_pdf(
    service: ReportExportService = Depends(get_report_export_service),
):
    content = await service.export_pdf("team")
    return _pdf_response(content, "team_report.pdf")


@router.get("/audit/export/pdf")
async def export_audit_pdf(
    service: ReportExportService = Depends(get_report_export_service),
):
    content = await service.export_pdf("audit")
    return _pdf_response(content, "audit_report.pdf")


# --------------------------------------------------
# Excel exports
# --------------------------------------------------


@router.get("/decision/export/excel")
async def export_decision_excel(
    service: ReportExportService = Depends(get_report_export_service),
):
    content = await service.export_excel("decision")
    return _excel_response(content, "decision_report.xlsx")


@router.get("/approval/export/excel")
async def export_approval_excel(
    service: ReportExportService = Depends(get_report_export_service),
):
    content = await service.export_excel("approval")
    return _excel_response(content, "approval_report.xlsx")


@router.get("/team/export/excel")
async def export_team_excel(
    service: ReportExportService = Depends(get_report_export_service),
):
    content = await service.export_excel("team")
    return _excel_response(content, "team_report.xlsx")


@router.get("/audit/export/excel")
async def export_audit_excel(
    service: ReportExportService = Depends(get_report_export_service),
):
    content = await service.export_excel("audit")
    return _excel_response(content, "audit_report.xlsx")
