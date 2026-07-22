from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.decision_history import DecisionHistory
from app.database.database import get_db
from app.models.decision import Decision
from app.models.user import User
from app.schemas.decision import (
    DecisionCreate,
    DecisionResponse,
    DecisionUpdate
)

from fastapi import UploadFile, File
import os

from app.models.decision_document import DecisionDocument
from app.core.dependencies import (
    get_current_user,
    require_reviewer
)
router = APIRouter(
    prefix="/decisions",
    tags=["Decisions"]
)


@router.post("/", response_model=DecisionResponse)
def create_decision(
    decision: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_decision = Decision(
        title=decision.title,
        description=decision.description,
        category=decision.category,
        created_by=current_user.id
    )

    db.add(new_decision)
    db.commit()
    db.refresh(new_decision)

    return new_decision

@router.put("/{decision_id}", response_model=DecisionResponse)
def update_decision(
    decision_id: int,
    decision: DecisionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find the decision
    db_decision = db.query(Decision).filter(
        Decision.id == decision_id
    ).first()

    if not db_decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Allow only the creator to update
    if db_decision.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Save current version to history
    history = DecisionHistory(
    decision_id=db_decision.id,
    title=db_decision.title,
    description=db_decision.description,
    category=db_decision.category,
    status=db_decision.status,
    updated_by=current_user.id
    )

    db.add(history)
    # Update fields
    db_decision.title = decision.title
    db_decision.description = decision.description
    db_decision.category = decision.category
    db_decision.status = decision.status

    db.commit()
    db.refresh(db_decision)

    return db_decision

@router.put("/{decision_id}/approve")
def approve_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reviewer)
):
    decision = db.query(Decision).filter(
        Decision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    decision.status = "Approved"

    db.commit()
    db.refresh(decision)

    return {
        "message": "Decision approved successfully",
        "decision": decision
    }

@router.put("/{decision_id}/reject")
def reject_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reviewer)
):
    decision = db.query(Decision).filter(
        Decision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    decision.status = "Rejected"

    db.commit()
    db.refresh(decision)

    return {
        "message": "Decision rejected successfully",
        "decision": decision
    }

@router.delete("/{decision_id}")
def delete_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find decision
    db_decision = db.query(Decision).filter(
        Decision.id == decision_id
    ).first()

    if not db_decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Only creator can delete
    if db_decision.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(db_decision)
    db.commit()

    return {"message": "Decision deleted successfully"}

@router.get("/", response_model=list[DecisionResponse])
def get_all_decisions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decisions = db.query(Decision).all()
    return decisions

@router.get("/{decision_id}", response_model=DecisionResponse)
def get_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = (
        db.query(Decision)
        .filter(
            Decision.id == decision_id,
        )
        .first()
    )

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    return decision

@router.get("/{decision_id}/documents")
def get_documents(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    documents = (
        db.query(DecisionDocument)
        .filter(DecisionDocument.decision_id == decision_id)
        .all()
    )

    return documents

@router.post("/{decision_id}/upload")
def upload_document(
    decision_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if decision exists
    decision = db.query(Decision).filter(
        Decision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Create uploads folder if it doesn't exist
    os.makedirs("uploads", exist_ok=True)

    # Save file
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    # Save file information in database
    document = DecisionDocument(
        decision_id=decision.id,
        file_name=file.filename,
        file_path=file_path,
        uploaded_by=current_user.id
    )

    db.add(document)
    db.commit()

    return {
        "message": "File uploaded successfully",
        "file_name": file.filename
    }

@router.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import os

    document = (
        db.query(DecisionDocument)
        .filter(DecisionDocument.id == document_id)
        .first()
    )

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Only the uploader can delete the document
    if document.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Delete the file from the uploads folder
    if os.path.exists(document.file_path):
        os.remove(document.file_path)

    # Delete the database record
    db.delete(document)
    db.commit()

    return {"message": "Document deleted successfully"}

@router.get("/stats/dashboard")
def dashboard_stats(
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

    return {
        "total": total,
        "approved": approved,
        "pending": pending,
        "rejected": rejected,
        "draft": draft
    }

@router.get("/{decision_id}/history")
def get_decision_history(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = (
        db.query(DecisionHistory)
        .filter(DecisionHistory.decision_id == decision_id)
        .order_by(DecisionHistory.updated_at.desc())
        .all()
    )

    return history