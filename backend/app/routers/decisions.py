import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.database.session import get_db
from app.models.user import User
from app.models.decision import Notification, Approval, AuditLog
from app.routers.deps import get_current_active_user, RoleChecker
from app.core.config import settings
from app.schemas.decision import (
    CategoryOut, CategoryCreate,
    DecisionOut, DecisionCreate, DecisionUpdate, DecisionDetailOut,
    AlternativeOut, AlternativeCreate, AlternativeUpdate,
    DiscussionOut, DiscussionCreate,
    AttachmentOut,
    ApprovalOut, ApprovalCreate, ApprovalAction,
    NotificationOut, AuditLogOut
)
from app.services.decision import (
    CategoryService, DecisionService, AlternativeService, DiscussionService, AttachmentService,
    ApprovalService, NotificationService, AuditLogService
)
from app.services.user import UserService
from app.utils.export import generate_decision_pdf, generate_decisions_excel


router = APIRouter(prefix="/decisions", tags=["decisions"])

# Ensure uploads directory exists
if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# ----------------- Category Endpoints -----------------
@router.get("/categories", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return CategoryService.list(db)

@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["administrator", "manager"]))
):
    existing = CategoryService.get_by_name(db, name=cat_in.name)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category already exists.")
    return CategoryService.create(db, cat_in=cat_in)


# ----------------- Decision Endpoints -----------------
@router.post("", response_model=DecisionOut, status_code=status.HTTP_201_CREATED)
def create_decision(
    decision_in: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify category exists
    category = CategoryService.get_by_id(db, cat_id=decision_in.category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Category ID.")
    
    # If no team is provided, set creator's team if they belong to one
    if not decision_in.team_id:
        decision_in.team_id = current_user.team_id
        
    return DecisionService.create(db, decision_in=decision_in, creator_id=current_user.id)

@router.get("", response_model=List[DecisionOut])
def list_decisions(
    category_id: Optional[int] = None,
    team_id: Optional[UUID] = None,
    creator_id: Optional[UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return DecisionService.list(
        db, category_id=category_id, team_id=team_id, creator_id=creator_id, status=status
    )

# ----------------- Audit Logs Endpoints -----------------
@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["administrator"]))
):
    return AuditLogService.list_logs(db)

# ----------------- Notifications Endpoints -----------------
@router.get("/notifications", response_model=List[NotificationOut])
def list_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return NotificationService.list_by_user(db, user_id=current_user.id)

@router.put("/notifications/{notif_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notif_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif or notif.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    return NotificationService.mark_as_read(db, db_notif=notif)

# ----------------- Approvals Endpoints (Static) -----------------
@router.get("/approvals/pending", response_model=List[ApprovalOut])
def get_pending_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return ApprovalService.list_pending_by_reviewer(db, reviewer_id=current_user.id)

# ----------------- Excel Export (Static) -----------------
@router.get("/export/excel")
def export_decisions_excel_endpoint(
    category_id: Optional[int] = None,
    team_id: Optional[UUID] = None,
    creator_id: Optional[UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    decisions = DecisionService.list(
        db, category_id=category_id, team_id=team_id, creator_id=creator_id, status=status
    )
    
    # Convert list of schemas to dictionaries
    from app.schemas.decision import DecisionOut
    decisions_dicts = [DecisionOut.model_validate(d).model_dump() for d in decisions]
    
    excel_buffer = generate_decisions_excel(decisions_dicts)
    
    # Log Audit
    AuditLogService.create(
        db,
        user_id=current_user.id,
        action="EXPORT_EXCEL",
        entity_name="decisions"
    )
    
    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=decision_logs_export.xlsx"}
    )

@router.get("/{decision_id}", response_model=DecisionDetailOut)
def read_decision(
    decision_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    decision = DecisionService.get_by_id(db, decision_id=decision_id)
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found.")
    return decision

@router.put("/{decision_id}", response_model=DecisionOut)
def update_decision(
    decision_id: UUID,
    decision_update: DecisionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    decision = DecisionService.get_by_id(db, decision_id=decision_id)
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found.")
        
    # Authorization: Creator, Manager of the creator, or Admin can edit
    can_edit = False
    if current_user.role == "administrator":
        can_edit = True
    elif decision.creator_id == current_user.id:
        can_edit = True
    elif current_user.role == "manager":
        # Check if the creator belongs to the manager's team
        creator = decision.creator
        if creator and creator.team_id == current_user.team_id:
            can_edit = True
            
    if not can_edit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this decision."
        )
        
    if decision_update.category_id:
        category = CategoryService.get_by_id(db, cat_id=decision_update.category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Category ID.")
            
    return DecisionService.update(db, db_decision=decision, decision_update=decision_update, user_id=current_user.id)

@router.delete("/{decision_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_decision(
    decision_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    decision = DecisionService.get_by_id(db, decision_id=decision_id)
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found.")
        
    # Authorization: Creator or Admin
    if current_user.role != "administrator" and decision.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this decision."
        )
        
    DecisionService.delete(db, db_decision=decision)
    return None


# ----------------- Alternatives Endpoints -----------------
@router.post("/{decision_id}/alternatives", response_model=AlternativeOut, status_code=status.HTTP_201_CREATED)
def add_alternative(
    decision_id: UUID,
    alt_in: AlternativeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    decision = DecisionService.get_by_id(db, decision_id=decision_id)
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found.")
        
    # Only creator, manager of creators team, or admin can add
    if current_user.role != "administrator" and decision.creator_id != current_user.id:
        if current_user.role != "manager" or decision.creator.team_id != current_user.team_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized action.")
            
    return AlternativeService.create(db, alt_in=alt_in, decision_id=decision_id)

@router.put("/alternatives/{alt_id}", response_model=AlternativeOut)
def update_alternative(
    alt_id: UUID,
    alt_update: AlternativeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    alt = AlternativeService.get_by_id(db, alt_id=alt_id)
    if not alt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alternative not found.")
        
    decision = alt.decision
    if current_user.role != "administrator" and decision.creator_id != current_user.id:
        if current_user.role != "manager" or decision.creator.team_id != current_user.team_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized action.")
            
    return AlternativeService.update(db, db_alt=alt, alt_in=alt_update)

@router.delete("/alternatives/{alt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alternative(
    alt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    alt = AlternativeService.get_by_id(db, alt_id=alt_id)
    if not alt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alternative not found.")
        
    decision = alt.decision
    if current_user.role != "administrator" and decision.creator_id != current_user.id:
        if current_user.role != "manager" or decision.creator.team_id != current_user.team_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized action.")
            
    AlternativeService.delete(db, db_alt=alt)
    return None


# ----------------- Discussion Endpoints -----------------
@router.post("/{decision_id}/comments", response_model=DiscussionOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    decision_id: UUID,
    comment_in: DiscussionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    decision = DecisionService.get_by_id(db, decision_id=decision_id)
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found.")
        
    # Check parent_id if provided
    if comment_in.parent_id:
        parent = DiscussionService.get_by_id(db, discussion_id=comment_in.parent_id)
        if not parent or parent.decision_id != decision_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid parent discussion thread.")
            
    return DiscussionService.create(db, comment_in=comment_in, decision_id=decision_id, user_id=current_user.id)

@router.get("/{decision_id}/comments", response_model=List[DiscussionOut])
def get_comments(
    decision_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    decision = DecisionService.get_by_id(db, decision_id=decision_id)
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found.")
    return DiscussionService.list_by_decision(db, decision_id=decision_id)


# ----------------- Uploads / Attachments Endpoints -----------------
@router.post("/{decision_id}/upload", response_model=AttachmentOut, status_code=status.HTTP_201_CREATED)
def upload_file(
    decision_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    decision = DecisionService.get_by_id(db, decision_id=decision_id)
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found.")
        
    # Save the file locally using a unique identifier prefix
    unique_prefix = uuid.uuid4().hex
    sanitized_filename = f"{unique_prefix}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, sanitized_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not save file: {e}")
        
    file_type = file.content_type
    
    return AttachmentService.create(
        db,
        file_name=file.filename,
        file_path=file_path,
        file_type=file_type,
        uploaded_by=current_user.id,
        decision_id=decision_id
    )

@router.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    attach = AttachmentService.get_by_id(db, attachment_id=attachment_id)
    if not attach:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found.")
        
    if not os.path.exists(attach.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Physical file not found on disk.")
        
    return FileResponse(
        path=attach.file_path,
        filename=attach.file_name,
        media_type=attach.file_type
    )

# Static routes have been moved up

# ----------------- Approvals Endpoints -----------------
@router.post("/{decision_id}/reviewer", response_model=ApprovalOut, status_code=status.HTTP_201_CREATED)
def assign_decision_reviewer(
    decision_id: UUID,
    approval_in: ApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    decision = DecisionService.get_by_id(db, decision_id=decision_id)
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found.")
        
    can_assign = False
    if current_user.role == "administrator":
        can_assign = True
    elif decision.creator_id == current_user.id:
        can_assign = True
    elif current_user.role == "manager":
        creator = decision.creator
        if creator and creator.team_id == current_user.team_id:
            can_assign = True
            
    if not can_assign:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to assign reviewers.")
        
    reviewer = UserService.get_by_id(db, user_id=approval_in.reviewer_id)
    if not reviewer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reviewer user not found.")
    if reviewer.role not in ["reviewer", "manager", "administrator"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Proposed reviewer must be Reviewer, Manager, or Admin.")
        
    existing = db.query(Approval).filter(
        Approval.decision_id == decision_id,
        Approval.reviewer_id == approval_in.reviewer_id,
        Approval.stage == approval_in.stage
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reviewer already assigned for this stage.")
        
    if decision.status == "draft":
        decision.status = "under_review"
        db.commit()
        
    db_approval = ApprovalService.assign_reviewer(db, decision_id=decision_id, reviewer_id=approval_in.reviewer_id, stage=approval_in.stage)
    
    # Log Audit Event
    AuditLogService.create(
        db,
        user_id=current_user.id,
        action="ASSIGN_REVIEWER",
        entity_name="decisions",
        entity_id=str(decision_id),
        new_values=f"Assigned {reviewer.full_name} for Stage {approval_in.stage}"
    )
    
    return db_approval

# Dynamic approvals actions below

@router.put("/approvals/{approval_id}", response_model=ApprovalOut)
def action_reviewer_approval(
    approval_id: UUID,
    action_in: ApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    approval = ApprovalService.get_by_id(db, approval_id=approval_id)
    if not approval:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval assignment not found.")
        
    if approval.reviewer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized. You are not the assigned reviewer.")
        
    if approval.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This assignment has already been actioned.")
        
    if action_in.status.lower() not in ["approved", "rejected"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be approved or rejected.")
        
    res = ApprovalService.action_approval(db, db_approval=approval, status=action_in.status, comments=action_in.comments)
    
    # Log Audit Event
    action_name = "DECISION_APPROVE" if action_in.status.lower() == "approved" else "DECISION_REJECT"
    AuditLogService.create(
        db,
        user_id=current_user.id,
        action=action_name,
        entity_name="decisions",
        entity_id=str(approval.decision_id),
        new_values=f"Reviewer remarks: {action_in.comments}"
    )
    
    return res

# ----------------- Reports & Export Endpoints -----------------
@router.get("/{decision_id}/export/pdf")
def export_decision_pdf_endpoint(
    decision_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    decision = DecisionService.get_by_id(db, decision_id=decision_id)
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found.")
        
    # Serialize decision schema to dict
    from app.schemas.decision import DecisionDetailOut
    decision_schema = DecisionDetailOut.model_validate(decision)
    decision_dict = decision_schema.model_dump()
    
    pdf_buffer = generate_decision_pdf(decision_dict)
    
    # Log Audit
    AuditLogService.create(
        db,
        user_id=current_user.id,
        action="EXPORT_PDF",
        entity_name="decisions",
        entity_id=str(decision_id)
    )
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=decision_report_{str(decision_id)[:8]}.pdf"}
    )


# Dynamic reports export above

