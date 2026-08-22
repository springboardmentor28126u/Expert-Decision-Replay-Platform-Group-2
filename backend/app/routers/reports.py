from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_manager
from app import crud
from fastapi.responses import FileResponse
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors
from openpyxl import Workbook
import tempfile
router = APIRouter(
    prefix="/reports",
    tags=["Reports & Analytics"]
)

# =====================================================
# DASHBOARD SUMMARY
# Manager & Administrator
# =====================================================

@router.get("/dashboard")
def dashboard_report(

    db: Session = Depends(get_db),

    current_user=Depends(require_manager)

):

    return crud.get_dashboard_summary(db)


# =====================================================
# DECISION STATISTICS
# =====================================================

@router.get("/decisions")
def decision_statistics(

    db: Session = Depends(get_db),

    current_user=Depends(require_manager)

):

    return crud.get_decision_statistics(db)


# =====================================================
# APPROVAL STATISTICS
# =====================================================

@router.get("/approvals")
def approval_statistics(

    db: Session = Depends(get_db),

    current_user=Depends(require_manager)

):

    return crud.get_approval_statistics(db)


# =====================================================
# USER ROLE STATISTICS
# =====================================================

@router.get("/users")
def user_statistics(

    db: Session = Depends(get_db),

    current_user=Depends(require_manager)

):

    return crud.get_user_statistics(db)


# =====================================================
# RECENT DECISIONS
# =====================================================

@router.get("/recent-decisions")
def recent_decisions(

    db: Session = Depends(get_db),

    current_user=Depends(require_manager)

):

    return crud.get_recent_decisions(db)


# =====================================================
# RECENT APPROVALS
# =====================================================

@router.get("/recent-approvals")
def recent_approvals(

    db: Session = Depends(get_db),

    current_user=Depends(require_manager)

):

    return crud.get_recent_approvals(db)
# =====================================================
# EXPORT REPORT PDF
# =====================================================

@router.get("/export/pdf")
def export_pdf(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    summary = crud.get_dashboard_summary(db)

    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")

    pdf = SimpleDocTemplate(temp.name)

    data = [
        ["Metric", "Value"],
        ["Total Users", summary["total_users"]],
        ["Total Decisions", summary["total_decisions"]],
        ["Draft Decisions", summary["draft_decisions"]],
        ["Approved Decisions", summary["approved_decisions"]],
        ["Rejected Decisions", summary["rejected_decisions"]],
        ["Pending Approvals", summary["pending_approvals"]],
        ["Total Discussions", summary["total_discussions"]],
        ["Knowledge Articles", summary["knowledge_articles"]],
]
    table = Table(data)

    table.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),colors.darkblue),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("GRID",(0,0),(-1,-1),1,colors.black),
        ("BACKGROUND",(0,1),(-1,-1),colors.beige)
    ]))

    pdf.build([table])

    return FileResponse(
        temp.name,
        filename="Reports.pdf",
        media_type="application/pdf"
    )
# =====================================================
# EXPORT REPORT EXCEL
# =====================================================

@router.get("/export/excel")
def export_excel(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    summary = crud.get_dashboard_summary(db)

    workbook = Workbook()

    sheet = workbook.active

    sheet.title = "Reports"

    sheet.append(["Metric", "Value"])

    sheet.append(["Total Users", summary["total_users"]])
    sheet.append(["Total Decisions", summary["total_decisions"]])
    sheet.append(["Draft Decisions", summary["draft_decisions"]])
    sheet.append(["Approved Decisions", summary["approved_decisions"]])
    sheet.append(["Rejected Decisions", summary["rejected_decisions"]])
    sheet.append(["Pending Approvals", summary["pending_approvals"]])
    sheet.append(["Total Discussions", summary["total_discussions"]])
    sheet.append(["Knowledge Articles", summary["knowledge_articles"]])
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")

    workbook.save(temp.name)

    return FileResponse(
        temp.name,
        filename="Reports.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )