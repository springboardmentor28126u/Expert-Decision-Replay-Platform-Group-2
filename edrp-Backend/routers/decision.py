from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import shutil

from models import Decision, Alternative, Knowledge, Category, DecisionVersion, Attachment
from schemas import DecisionCreate, DecisionOut, AlternativeCreate, AlternativeOut, KnowledgeCreate, KnowledgeOut, CategoryAssign, CategoryOut, DecisionStatusUpdate, DecisionVersionOut, AttachmentOut
from auth import get_current_user, get_db

router = APIRouter()

def create_decision_version(db: Session, decision: Decision, user_id: int):
    last_version = db.query(DecisionVersion).filter(
        DecisionVersion.decision_id == decision.id
    ).order_by(DecisionVersion.version_number.desc()).first()
    
    next_version = (last_version.version_number + 1) if last_version else 1
    
    db_version = DecisionVersion(
        decision_id=decision.id,
        version_number=next_version,
        title=decision.title,
        description=decision.description,
        status=decision.status,
        updated_by=user_id
    )
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    return db_version

# ----- Decision Endpoints -----
@router.post("/", response_model=DecisionOut)
def create_decision(
    decision: DecisionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_decision = Decision(
        title=decision.title,
        description=decision.description,
        status=decision.status,
        owner_id=current_user.id,
    )
    db.add(db_decision)
    db.commit()
    db.refresh(db_decision)
    return db_decision

@router.get("/", response_model=List[DecisionOut])
def list_decisions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    category_id: int | None = None,
):
    query = db.query(Decision)
    if category_id is not None:
        query = query.filter(Decision.category_id == category_id)
    return query.all()

@router.get("/{decision_id}", response_model=DecisionOut)
def get_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision

# ----- Decision Update & Delete -----
@router.patch("/{decision_id}", response_model=DecisionOut)
def update_decision(
    decision_id: int,
    decision: DecisionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not db_decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    # Update fields if changes exist
    has_changes = (
        db_decision.title != decision.title or
        db_decision.description != decision.description or
        db_decision.status != decision.status
    )
    if has_changes:
        db_decision.title = decision.title
        db_decision.description = decision.description
        db_decision.status = decision.status
        db.commit()
        db.refresh(db_decision)
        create_decision_version(db, db_decision, current_user.id)
    return db_decision

@router.delete("/{decision_id}", response_model=dict)
def delete_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not db_decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    db.delete(db_decision)
    db.commit()
    return {"detail": "Decision deleted"}

@router.patch("/{decision_id}/category", response_model=CategoryOut)
def assign_category(
    decision_id: int,
    assign: CategoryAssign,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    category = db.query(Category).filter(Category.id == assign.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    decision.category_id = category.id
    db.commit()
    db.refresh(decision)
    return category

@router.patch("/{decision_id}/status", response_model=DecisionOut)
def update_decision_status(
    decision_id: int,
    status_update: DecisionStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not db_decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    current_status = db_decision.status
    new_status = status_update.status

    allowed_transitions = {
        "draft": ["draft", "in_review"],
        "in_review": ["in_review", "finalized"],
        "finalized": ["finalized"]
    }

    if new_status not in allowed_transitions.get(current_status, ["draft"]):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from '{current_status}' to '{new_status}'"
        )

    if current_status != new_status:
        db_decision.status = new_status
        db.commit()
        db.refresh(db_decision)
        create_decision_version(db, db_decision, current_user.id)
    return db_decision

# ----- Decision Version History Endpoints -----
@router.post("/{decision_id}/versions", response_model=DecisionVersionOut)
def manually_create_version(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    # Check if last version matches the current state
    last_version = db.query(DecisionVersion).filter(
        DecisionVersion.decision_id == decision.id
    ).order_by(DecisionVersion.version_number.desc()).first()
    
    if last_version:
        no_changes = (
            last_version.title == decision.title and
            last_version.description == decision.description and
            last_version.status == decision.status
        )
        if no_changes:
            raise HTTPException(status_code=400, detail="No changes detected since last version. Version not created.")
            
    return create_decision_version(db, decision, current_user.id)

@router.get("/{decision_id}/versions", response_model=List[DecisionVersionOut])
def list_decision_versions(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
        
    return db.query(DecisionVersion).filter(
        DecisionVersion.decision_id == decision_id
    ).order_by(DecisionVersion.version_number.asc()).all()

@router.get("/{decision_id}/versions/{version_number}", response_model=DecisionVersionOut)
def get_decision_version(
    decision_id: int,
    version_number: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
        
    version = db.query(DecisionVersion).filter(
        DecisionVersion.decision_id == decision_id,
        DecisionVersion.version_number == version_number
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
        
    return version



# ----- Alternative Endpoints -----
@router.post("/{decision_id}/alternatives", response_model=AlternativeOut)
def add_alternative(
    decision_id: int,
    alternative: AlternativeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    db_alt = Alternative(
        decision_id=decision_id,
        description=alternative.description,
        pros=alternative.pros,
        cons=alternative.cons,
        score=alternative.score,
    )
    db.add(db_alt)
    db.commit()
    db.refresh(db_alt)
    return db_alt

@router.get("/{decision_id}/alternatives", response_model=List[AlternativeOut])
def list_alternatives(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return db.query(Alternative).filter(Alternative.decision_id == decision_id).all()

# ----- Knowledge Endpoints -----
@router.post("/{decision_id}/knowledge", response_model=KnowledgeOut)
def add_knowledge(
    decision_id: int,
    knowledge: KnowledgeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    db_knowledge = Knowledge(
        decision_id=decision_id,
        content=knowledge.content,
        source=knowledge.source,
    )
    db.add(db_knowledge)
    db.commit()
    db.refresh(db_knowledge)
    return db_knowledge

@router.get("/{decision_id}/knowledge", response_model=List[KnowledgeOut])
def list_knowledge(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return db.query(Knowledge).filter(Knowledge.decision_id == decision_id).all()

# ----- Document Upload Endpoints -----
MAX_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg"}
UPLOAD_DIR = "uploads"

@router.post("/{decision_id}/attachments", response_model=AttachmentOut)
def upload_attachment(
    decision_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
        
    _, ext = os.path.splitext(file.filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed")
        
    # Check size
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds maximum allowed limit of 10 MB")
        
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(stored_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_attachment = Attachment(
        decision_id=decision_id,
        file_name=file.filename,
        file_path=stored_path,
        file_type=file.content_type or ext.replace(".", ""),
    )
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment

@router.get("/{decision_id}/attachments", response_model=List[AttachmentOut])
def list_attachments(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
        
    return db.query(Attachment).filter(Attachment.decision_id == decision_id).all()
