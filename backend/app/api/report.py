from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.decision import Decision
from openpyxl import Workbook

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

@router.get("/excel")
def export_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decisions = db.query(Decision).all()

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Decision Report"

    sheet.append([
        "ID",
        "Title",
        "Description",
        "Category",
        "Status"
    ])

    for decision in decisions:
        sheet.append([
            decision.id,
            decision.title,
            decision.description,
            decision.category,
            decision.status
        ])

    file_name = "Decision_Report.xlsx"

    workbook.save(file_name)

    return FileResponse(
        path=file_name,
        filename=file_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@router.get("/summary")
def report_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total = db.query(Decision).count()

    approved = db.query(Decision).filter(
        Decision.status == "Approved"
    ).count()

    pending = db.query(Decision).filter(
        Decision.status == "Pending"
    ).count()

    rejected = db.query(Decision).filter(
        Decision.status == "Rejected"
    ).count()

    draft = db.query(Decision).filter(
        Decision.status == "Draft"
    ).count()

    categories = {}

    decisions = db.query(Decision).all()

    for decision in decisions:
        category = decision.category or "Other"

        if category not in categories:
            categories[category] = 0

        categories[category] += 1

    return {
        "total_decisions": total,
        "approved": approved,
        "pending": pending,
        "rejected": rejected,
        "draft": draft,
        "category_report": categories
    }


@router.get("/pdf")
def export_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decisions = db.query(Decision).all()

    pdf_file = "decision_report.pdf"

    document = SimpleDocTemplate(pdf_file)

    data = [
        ["ID", "Title", "Category", "Status"]
    ]

    for d in decisions:
        data.append([
            str(d.id),
            d.title,
            d.category,
            d.status
        ])

    table = Table(data)

    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.blue),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("GRID", (0,0), (-1,-1), 1, colors.black),
            ("BACKGROUND", (0,1), (-1,-1), colors.beige),
            ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ])
    )

    document.build([table])

    return FileResponse(
        pdf_file,
        filename="Decision_Report.pdf",
        media_type="application/pdf"
    )