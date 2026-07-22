import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from openpyxl import Workbook
from typing import Dict, Any

def generate_decision_pdf(decision: Dict[str, Any]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Premium styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#6366f1'),
        spaceAfter=15
    )
    
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )

    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['BodyText'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#475569')
    )

    story = []
    
    # 1. Document Title
    story.append(Paragraph(decision.get("title", "Decision Report"), title_style))
    story.append(Spacer(1, 10))
    
    # 2. Metadata Table
    meta_data = [
        [
            Paragraph("Category:", meta_label_style),
            Paragraph(decision.get("category", {}).get("name", "N/A"), body_style),
            Paragraph("Status:", meta_label_style),
            Paragraph(decision.get("status", "N/A").upper().replace("_", " "), body_style)
        ],
        [
            Paragraph("Creator:", meta_label_style),
            Paragraph(decision.get("creator", {}).get("full_name", "N/A"), body_style),
            Paragraph("Version:", meta_label_style),
            Paragraph(f"v{decision.get('version', 1)}", body_style)
        ]
    ]
    t = Table(meta_data, colWidths=[60, 180, 60, 180])
    t.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,1), (-1,1), 1, colors.HexColor('#cbd5e1'))
    ]))
    story.append(t)
    story.append(Spacer(1, 15))
    
    # 3. Problem Statement
    story.append(Paragraph("Problem Statement / Context", section_title_style))
    story.append(Paragraph(decision.get("problem_statement", ""), body_style))
    story.append(Spacer(1, 10))
    
    # 4. Evaluation Criteria
    story.append(Paragraph("Evaluation Criteria", section_title_style))
    story.append(Paragraph(decision.get("evaluation_criteria", ""), body_style))
    story.append(Spacer(1, 15))
    
    # 5. Alternatives
    story.append(Paragraph("Alternatives Comparison", section_title_style))
    for alt in decision.get("alternatives", []):
        chosen_badge = " [CHOSEN]" if alt.get("is_chosen") else ""
        alt_title = f"• {alt.get('title')}{chosen_badge} - Est. Cost: ${alt.get('cost_estimate', 0):,.2f}"
        story.append(Paragraph(alt_title, ParagraphStyle('AltTitle', parent=body_style, fontName='Helvetica-Bold')))
        story.append(Paragraph(f"<b>Pros:</b> {alt.get('pros')}", body_style))
        story.append(Paragraph(f"<b>Cons:</b> {alt.get('cons')}", body_style))
        story.append(Paragraph(f"<b>Feasibility & Risk:</b> {alt.get('feasibility_analysis')} / {alt.get('risk_assessment')}", body_style))
        story.append(Spacer(1, 5))
        
    doc.build(story)
    buffer.seek(0)
    return buffer

def generate_decisions_excel(decisions_list: list) -> io.BytesIO:
    buffer = io.BytesIO()
    wb = Workbook()
    ws = wb.active
    ws.title = "Decision Logs"
    
    # Headers
    headers = [
        "ID", "Title", "Category", "Status", "Creator", "Version", 
        "Problem Statement", "Evaluation Criteria", "Created At"
    ]
    ws.append(headers)
    
    # Data Rows
    for dec in decisions_list:
        row = [
            str(dec.get("id")),
            dec.get("title"),
            dec.get("category", {}).get("name", ""),
            dec.get("status", ""),
            dec.get("creator", {}).get("full_name", ""),
            dec.get("version"),
            dec.get("problem_statement"),
            dec.get("evaluation_criteria"),
            str(dec.get("created_at"))[:10] if dec.get("created_at") else ""
        ]
        ws.append(row)

        
    # Styling columns widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = col[0].column_letter
        ws.column_dimensions[col_letter].width = min(max(max_len + 3, 10), 40)
        
    wb.save(buffer)
    buffer.seek(0)
    return buffer
