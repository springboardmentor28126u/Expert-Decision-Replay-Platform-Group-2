from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
from pathlib import Path
from shutil import copyfileobj
from uuid import uuid4
from typing import List

from database import engine, Base, get_db
from models import User, UserRole
from discussion import DiscussionMessage

from uploads import router as uploads_router

from schemas import UserCreate, UserLogin, UserResponse, Token

from auth import hash_password, verify_password, create_access_token, get_current_user, require_role
# Create all tables (safe to keep, won't duplicate existing ones)
Base.metadata.create_all(bind=engine)

app = FastAPI()

UPLOAD_ROOT = Path(__file__).resolve().parent / "uploads"
DISCUSSION_UPLOAD_DIR = UPLOAD_ROOT / "discussion"
ALLOWED_DISCUSSION_EXTENSIONS = {".pdf", ".docx", ".jpg", ".jpeg", ".png"}
UPLOAD_ROOT.mkdir(exist_ok=True)
DISCUSSION_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")
app.include_router(uploads_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Expert Decision Replay Platform backend is running"}


@app.post("/register", response_model=UserResponse, tags=["Authentication"])
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.execute(
        select(User).where(User.email == user.email)
    ).scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hash_password(user.password),
        role=UserRole.employee,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login", response_model=Token, tags=["Authentication"])
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.execute(
        select(User).where(User.email == credentials.email)
    ).scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})

    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/me", response_model=UserResponse, tags=["Authentication"])
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

from schemas import ChangePassword

@app.put("/me/change-password")
def change_password(
    payload: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


@app.get("/users", response_model=List[UserResponse], tags=["User Management"])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    users = db.execute(select(User)).scalars().all()
    return users

from schemas import RoleUpdate

@app.put("/users/{user_id}/role", response_model=UserResponse, tags=["User Management"])
def update_user_role(
    user_id: int,
    role_update: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    target_user = db.execute(
        select(User).where(User.id == user_id)
    ).scalar_one_or_none()

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role"
        )

    target_user.role = role_update.role
    db.commit()
    db.refresh(target_user)

    return target_user

from schemas import DecisionCreate, DecisionResponse, DecisionStatusUpdate
from models import Decision, DecisionStatus
from typing import List as ListType

def _with_creator_name(decision: Decision) -> Decision:
    decision.creator_name = decision.creator.full_name if decision.creator else None
    return decision

@app.post("/decisions", response_model=DecisionResponse, tags=["Decision Management"])
def create_decision(
    decision: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_decision = Decision(
        title=decision.title,
        problem_statement=decision.problem_statement,
        category=decision.category,
        created_by=current_user.id,
        attachment_url=decision.attachment_url,
    )
    db.add(new_decision)
    db.commit()
    db.refresh(new_decision)
    new_decision.creator_name = new_decision.creator.full_name
    return new_decision

@app.get("/decisions", response_model=ListType[DecisionResponse], tags=["Decision Management"])
def list_decisions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decisions = db.execute(select(Decision)).scalars().all()
    for d in decisions:
        d.creator_name = d.creator.full_name if d.creator else None
    return decisions

@app.get("/decisions/{decision_id}", response_model=DecisionResponse, tags=["Decision Management"])
def get_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    decision.creator_name = decision.creator.full_name if decision.creator else None
    return decision


@app.put("/decisions/{decision_id}/status", response_model=DecisionResponse, tags=["Decision Management"])
def update_decision_status(
    decision_id: int,
    status_update: DecisionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.manager, UserRole.admin)),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    if status_update.status in (DecisionStatus.approved, DecisionStatus.rejected):
        raise HTTPException(
            status_code=400,
            detail="Use the /approve or /reject endpoints to move a decision to approved or rejected, so the review is properly recorded with a comment and reviewer."
        )

    decision.status = status_update.status
    db.commit()
    db.refresh(decision)
    return decision

from schemas import ApprovalCreate, ApprovalResponse
from models import Approval, ApprovalAction

@app.post("/decisions/{decision_id}/approve", response_model=ApprovalResponse, tags=["Approval Workflow"])
def approve_decision(
    decision_id: int,
    approval: ApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.manager, UserRole.admin)),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    new_approval = Approval(
        decision_id=decision_id,
        reviewer_id=current_user.id,
        action=ApprovalAction.approved,
        comment=approval.comment,
    )
    db.add(new_approval)

    decision.status = DecisionStatus.approved
    db.commit()
    db.refresh(new_approval)
    new_approval.reviewer_name = current_user.full_name
    return new_approval


@app.post("/decisions/{decision_id}/reject", response_model=ApprovalResponse, tags=["Approval Workflow"])
def reject_decision(
    decision_id: int,
    approval: ApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.manager, UserRole.admin)),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    if not approval.comment or not approval.comment.strip():
        raise HTTPException(status_code=400, detail="A comment is required when rejecting a decision")

    new_approval = Approval(
        decision_id=decision_id,
        reviewer_id=current_user.id,
        action=ApprovalAction.rejected,
        comment=approval.comment,
    )
    db.add(new_approval)

    decision.status = DecisionStatus.rejected
    db.commit()
    db.refresh(new_approval)
    new_approval.reviewer_name = current_user.full_name
    return new_approval

@app.post("/decisions/{decision_id}/resubmit", response_model=DecisionResponse, tags=["Approval Workflow"])
def resubmit_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    if decision.status != DecisionStatus.rejected:
        raise HTTPException(
            status_code=400,
            detail="Only a rejected decision can be resubmitted for review"
        )

    if current_user.id != decision.created_by and current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=403,
            detail="Only the decision's creator or an admin can resubmit it"
        )
    
    resubmission_record = Approval(
        decision_id=decision_id,
        reviewer_id=current_user.id,
        action=ApprovalAction.resubmitted,
        comment="Resubmitted for review after rejection",
    )
    db.add(resubmission_record)

    decision.status = DecisionStatus.under_review
    db.commit()
    db.refresh(decision)
    return decision

@app.get("/decisions/{decision_id}/approvals", response_model=ListType[ApprovalResponse], tags=["Approval Workflow"])
def get_decision_approvals(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    approvals = db.execute(
        select(Approval)
        .where(Approval.decision_id == decision_id)
        .order_by(Approval.created_at)
    ).scalars().all()
    for a in approvals:
        a.reviewer_name = a.reviewer.full_name if a.reviewer else None
    return approvals

from schemas import DecisionUpdate, DecisionVersionResponse
from models import DecisionVersion

@app.put("/decisions/{decision_id}", response_model=DecisionResponse, tags=["Decision Management"])
def update_decision(
    decision_id: int,
    decision_update: DecisionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Only the creator or an admin can change/remove an EXISTING attachment
    update_data = decision_update.model_dump(exclude_unset=True)
    if "attachment_url" in update_data and decision.attachment_url:
        if current_user.id != decision.created_by and current_user.role != UserRole.admin:
            raise HTTPException(
                status_code=403,
                detail="Only the decision's creator or an admin can change or remove its attachment"
            )

    # Save a version snapshot of the CURRENT state, before making changes
    existing_versions = db.execute(
        select(DecisionVersion).where(DecisionVersion.decision_id == decision_id)
    ).scalars().all()
    next_version_number = len(existing_versions) + 1

    snapshot = DecisionVersion(
        decision_id=decision.id,
        version_number=next_version_number,
        title=decision.title,
        problem_statement=decision.problem_statement,
        category=decision.category,
        status=decision.status.value,
        changed_by=current_user.id,
    )
    db.add(snapshot)

    # Now apply the updates
    update_data = decision_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(decision, key, value)

    db.commit()
    db.refresh(decision)
    return decision


@app.get("/decisions/{decision_id}/versions", response_model=ListType[DecisionVersionResponse], tags=["Version Tracking"])
def get_decision_versions(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    versions = db.execute(
        select(DecisionVersion)
        .where(DecisionVersion.decision_id == decision_id)
        .order_by(DecisionVersion.version_number)
    ).scalars().all()

    return versions

@app.delete("/decisions/{decision_id}", tags=["Decision Management"])
def delete_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    db.delete(decision)
    db.commit()

    return {"message": "Decision deleted successfully"}

from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import io

@app.get("/decisions/{decision_id}/export", tags=["Decision Management"])
def export_decision_pdf(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    alternatives = db.execute(
        select(Alternative).where(Alternative.decision_id == decision_id)
    ).scalars().all()

    creator_name = decision.creator.full_name if decision.creator else "Unknown"

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 1 * inch

    def line(text, size=11, bold=False, gap=0.28):
        nonlocal y
        p.setFont("Helvetica-Bold" if bold else "Helvetica", size)
        p.drawString(1 * inch, y, text)
        y -= gap * inch

    line("Expert Decision Replay Platform", size=10, bold=True)
    line("Decision Record", size=16, bold=True, gap=0.4)

    line(f"Title: {decision.title}", bold=True)
    line(f"Status: {decision.status.value.replace('_', ' ').title()}")
    line(f"Category: {decision.category or 'Uncategorized'}")
    line(f"Created by: {creator_name}")
    line(f"Created on: {decision.created_at.strftime('%d %b %Y, %I:%M %p')}", gap=0.4)

    line("Problem Statement:", bold=True)
    # wrap long text manually, simple version
    statement = decision.problem_statement
    words = statement.split()
    current_line = ""
    for word in words:
        if len(current_line) + len(word) < 90:
            current_line += word + " "
        else:
            line(current_line)
            current_line = word + " "
    if current_line:
        line(current_line, gap=0.4)

    if alternatives:
        line("Alternatives Considered:", bold=True)
        for alt in alternatives:
            line(f"- {alt.title}  (Risk: {alt.risk_level.value}, Feasibility: {alt.feasibility.value}, Cost: {alt.cost})")
        y -= 0.1 * inch

    p.setFont("Helvetica-Oblique", 8)
    p.drawString(1 * inch, 0.6 * inch, "Generated from Expert Decision Replay Platform")

    p.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=decision_{decision_id}.pdf"}
    )


# ===================== ALTERNATIVES ENDPOINTS =====================

from schemas import AlternativeCreate, AlternativeResponse, AlternativeUpdate, AlternativeComparisonResponse
from models import Alternative

@app.post("/alternatives", response_model=AlternativeResponse, tags=["Alternative Comparison"])
def create_alternative(
    alternative: AlternativeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == alternative.decision_id)
    ).scalar_one_or_none()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    new_alternative = Alternative(
        decision_id=alternative.decision_id,
        title=alternative.title,
        description=alternative.description,
        pros=alternative.pros,
        cons=alternative.cons,
        cost=alternative.cost,
        risk_level=alternative.risk_level,
        feasibility=alternative.feasibility,
    )

    db.add(new_alternative)
    db.commit()
    db.refresh(new_alternative)

    return new_alternative


@app.get("/decisions/{decision_id}/alternatives", response_model=ListType[AlternativeResponse], tags=["Alternative Comparison"])
def list_alternatives(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    alternatives = db.execute(
        select(Alternative).where(Alternative.decision_id == decision_id)
    ).scalars().all()

    return alternatives


@app.get("/alternatives/{alternative_id}", response_model=AlternativeResponse, tags=["Alternative Comparison"])
def get_alternative(
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alternative = db.execute(
        select(Alternative).where(Alternative.id == alternative_id)
    ).scalar_one_or_none()

    if not alternative:
        raise HTTPException(status_code=404, detail="Alternative not found")

    return alternative


@app.put("/alternatives/{alternative_id}", response_model=AlternativeResponse, tags=["Alternative Comparison"])
def update_alternative(
    alternative_id: int,
    alternative_update: AlternativeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alternative = db.execute(
        select(Alternative).where(Alternative.id == alternative_id)
    ).scalar_one_or_none()
    if not alternative:
        raise HTTPException(status_code=404, detail="Alternative not found")

    update_data = alternative_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(alternative, key, value)

    db.commit()
    db.refresh(alternative)

    return alternative


@app.delete("/alternatives/{alternative_id}", tags=["Alternative Comparison"])
def delete_alternative(
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alternative = db.execute(
        select(Alternative).where(Alternative.id == alternative_id)
    ).scalar_one_or_none()

    if not alternative:
        raise HTTPException(status_code=404, detail="Alternative not found")

    db.delete(alternative)
    db.commit()

    return {"message": "Alternative deleted successfully"}


@app.get("/decisions/{decision_id}/compare", response_model=AlternativeComparisonResponse, tags=["Alternative Comparison"])
def compare_alternatives(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    alternatives = db.execute(
        select(Alternative).where(Alternative.decision_id == decision_id)
    ).scalars().all()

    return {
        "decision_id": decision.id,
        "decision_title": decision.title,
        "alternatives": alternatives,
    }


# ===================== DISCUSSION ENDPOINTS =====================

from schemas import DiscussionCreate, DiscussionReplyCreate, DiscussionUpdate, DiscussionResponse
from crud_discussion import (
    add_comment,
    add_meeting_note,
    delete_comment,
    edit_comment,
    get_comment_or_none,
    get_comments_for_decision,
    get_decision_or_none,
    reply_to_comment,
)


def _read_discussion_payload(payload: dict, required_fields: list[str]) -> dict:
    missing_fields = [field for field in required_fields if payload.get(field) in (None, "")]
    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required field(s): {', '.join(missing_fields)}",
        )
    return payload


async def _parse_discussion_request(request: Request) -> tuple[dict, UploadFile | None]:
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        attachment = form.get("attachment")
        payload = {key: value for key, value in form.items() if key != "attachment"}
        if attachment is not None and not hasattr(attachment, "filename"):
            attachment = None
        return payload, attachment

    if content_type.startswith("application/json"):
        return await request.json(), None

    raise HTTPException(status_code=415, detail="Use JSON or multipart/form-data")


def _save_discussion_attachment(attachment: UploadFile | None) -> str | None:
    if not attachment or not attachment.filename:
        return None

    extension = Path(attachment.filename).suffix.lower()
    if extension not in ALLOWED_DISCUSSION_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Attachment must be a PDF, DOCX, JPG, or PNG file",
        )

    filename = f"{uuid4().hex}{extension}"
    file_path = DISCUSSION_UPLOAD_DIR / filename
    with file_path.open("wb") as buffer:
        copyfileobj(attachment.file, buffer)

    return f"/uploads/discussion/{filename}"


@app.post(
    "/discussion",
    response_model=DiscussionResponse,
    tags=["Discussion Module"],
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "decision_id": {"type": "integer"},
                            "message": {"type": "string"},
                            "attachment_url": {"type": "string"}
                        },
                        "required": ["decision_id", "message"]
                    }
                },
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "decision_id": {"type": "integer"},
                            "message": {"type": "string"},
                            "attachment": {"type": "string", "format": "binary"},
                            "attachment_url": {"type": "string"}
                        },
                        "required": ["decision_id", "message"]
                    }
                }
            }
        }
    }
)
async def add_discussion_comment(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload, attachment = await _parse_discussion_request(request)
    payload = _read_discussion_payload(payload, ["decision_id", "message"])
    discussion = DiscussionCreate(
        decision_id=int(str(payload["decision_id"])),
        message=str(payload["message"]),
        attachment_url=payload.get("attachment_url"),
    )

    if not get_decision_or_none(db, discussion.decision_id):
        raise HTTPException(status_code=404, detail="Decision not found")

    attachment_url = _save_discussion_attachment(attachment) or discussion.attachment_url
    return add_comment(
        db,
        decision_id=discussion.decision_id,
        user_id=current_user.id,
        message=discussion.message,
        attachment_url=attachment_url,
    )


@app.post(
    "/discussion/meeting-note",
    response_model=DiscussionResponse,
    tags=["Discussion Module"],
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "decision_id": {"type": "integer"},
                            "message": {"type": "string"},
                            "attachment_url": {"type": "string"}
                        },
                        "required": ["decision_id", "message"]
                    }
                },
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "decision_id": {"type": "integer"},
                            "message": {"type": "string"},
                            "attachment": {"type": "string", "format": "binary"},
                            "attachment_url": {"type": "string"}
                        },
                        "required": ["decision_id", "message"]
                    }
                }
            }
        }
    }
)
async def add_discussion_meeting_note(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload, attachment = await _parse_discussion_request(request)
    payload = _read_discussion_payload(payload, ["decision_id", "message"])
    decision_id = int(str(payload["decision_id"]))
    message = str(payload["message"])
    attachment_url = payload.get("attachment_url")

    if not get_decision_or_none(db, decision_id):
        raise HTTPException(status_code=404, detail="Decision not found")

    saved_attachment_url = _save_discussion_attachment(attachment) or attachment_url
    return add_meeting_note(
        db,
        decision_id=decision_id,
        user_id=current_user.id,
        message=message,
        attachment_url=saved_attachment_url,
    )


@app.post(
    "/discussion/reply",
    response_model=DiscussionResponse,
    tags=["Discussion Module"],
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "parent_id": {"type": "integer"},
                            "message": {"type": "string"},
                            "attachment_url": {"type": "string"}
                        },
                        "required": ["parent_id", "message"]
                    }
                },
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "parent_id": {"type": "integer"},
                            "message": {"type": "string"},
                            "attachment": {"type": "string", "format": "binary"},
                            "attachment_url": {"type": "string"}
                        },
                        "required": ["parent_id", "message"]
                    }
                }
            }
        }
    }
)
async def reply_to_discussion_comment(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload, attachment = await _parse_discussion_request(request)
    payload = _read_discussion_payload(payload, ["parent_id", "message"])
    discussion_reply = DiscussionReplyCreate(
        parent_id=int(payload["parent_id"]),
        message=str(payload["message"]),
        attachment_url=payload.get("attachment_url"),
    )

    parent = get_comment_or_none(db, discussion_reply.parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent comment not found")
    if not get_decision_or_none(db, parent.decision_id):
        raise HTTPException(status_code=404, detail="Decision not found")

    attachment_url = _save_discussion_attachment(attachment) or discussion_reply.attachment_url
    return reply_to_comment(
        db,
        parent=parent,
        user_id=current_user.id,
        message=discussion_reply.message,
        attachment_url=attachment_url,
    )


@app.get("/discussion/decision/{decision_id}", response_model=ListType[DiscussionResponse], tags=["Discussion Module"])
def get_decision_discussion_thread(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not get_decision_or_none(db, decision_id):
        raise HTTPException(status_code=404, detail="Decision not found")
    return get_comments_for_decision(db, decision_id)


@app.put(
    "/discussion/{discussion_id}",
    response_model=DiscussionResponse, 
    tags=["Discussion Module"],
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "message": {"type": "string"},
                            "attachment_url": {"type": "string"}
                        }
                    }
                },
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "message": {"type": "string"},
                            "attachment": {"type": "string", "format": "binary"},
                            "attachment_url": {"type": "string"}
                        }
                    }
                }
            }
        }
    }
)
async def edit_discussion_comment(
    discussion_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = get_comment_or_none(db, discussion_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the comment owner can edit this comment")

    payload, attachment = await _parse_discussion_request(request)
    update = DiscussionUpdate(
        message=payload.get("message"),
        attachment_url=payload.get("attachment_url"),
    )
    attachment_url = _save_discussion_attachment(attachment) or update.attachment_url
    if update.message is None and attachment_url is None:
        raise HTTPException(status_code=400, detail="Provide message or attachment")

    return edit_comment(
        db,
        comment=comment,
        user_id=current_user.id,
        message=update.message,
        attachment_url=attachment_url,
    )


@app.delete("/discussion/{discussion_id}", tags=["Discussion Module"])
def delete_discussion_comment(
    discussion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = get_comment_or_none(db, discussion_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    can_delete = comment.user_id == current_user.id or current_user.role in {
        UserRole.manager,
        UserRole.admin,
    }
    if not can_delete:
        raise HTTPException(status_code=403, detail="Only the owner, manager, or admin can delete this comment")

    delete_comment(db, comment=comment, user=current_user)
    return {"message": "Comment deleted successfully"}