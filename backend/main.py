from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
from pathlib import Path
from shutil import copyfileobj
from uuid import uuid4

from database import engine, Base, get_db
from models import User, UserRole
from discussion import DiscussionMessage

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Expert Decision Replay Platform backend is running"}


@app.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.execute(
        select(User).where(User.email == user.email)
    ).scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user with hashed password
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


@app.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.execute(
        select(User).where(User.email == credentials.email)
    ).scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})

    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

from typing import List

@app.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    users = db.execute(select(User)).scalars().all()
    return users

from schemas import RoleUpdate

@app.put("/users/{user_id}/role", response_model=UserResponse)
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

@app.post("/decisions", response_model=DecisionResponse)
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
    )
    db.add(new_decision)
    db.commit()
    db.refresh(new_decision)
    return new_decision


@app.get("/decisions", response_model=ListType[DecisionResponse])
def list_decisions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decisions = db.execute(select(Decision)).scalars().all()
    return decisions


@app.get("/decisions/{decision_id}", response_model=DecisionResponse)
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
    return decision


@app.put("/decisions/{decision_id}/status", response_model=DecisionResponse)
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

    decision.status = status_update.status
    db.commit()
    db.refresh(decision)
    return decision

from schemas import DiscussionCreate, DiscussionReplyCreate, DiscussionUpdate, DiscussionResponse
from crud_discussion import (
    add_comment,
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


@app.post("/discussion", response_model=DiscussionResponse)
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


@app.post("/discussion/reply", response_model=DiscussionResponse)
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


@app.get("/discussion/decision/{decision_id}", response_model=ListType[DiscussionResponse])
def get_decision_discussion_thread(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not get_decision_or_none(db, decision_id):
        raise HTTPException(status_code=404, detail="Decision not found")
    return get_comments_for_decision(db, decision_id)


@app.put("/discussion/{discussion_id}", response_model=DiscussionResponse)
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


@app.delete("/discussion/{discussion_id}")
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

