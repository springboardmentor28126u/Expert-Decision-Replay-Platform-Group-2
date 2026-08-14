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
from app.models.audit_log import AuditLog
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

    # Audit Log
    log = AuditLog(
        user_id=current_user.id,
        action="Create Decision",
        description=f"Created decision '{new_decision.title}'"
    )

    db.add(log)
    db.commit()

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
    audit = AuditLog(
    user_id=current_user.id,
    action="Updated Decision",
    description=f"Updated decision '{db_decision.title}'"
    )

    db.add(audit)
    db.commit()


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
    audit = AuditLog(
    user_id=current_user.id,
    action="Approved Decision",
    description=f"Approved decision '{decision.title}'"
    )

    db.add(audit)
    db.commit()
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

    audit = AuditLog(
    user_id=current_user.id,
    action="Rejected Decision",
    description=f"Rejected decision '{decision.title}'"
    )

    db.add(audit)
    db.commit()

    db.add(audit)
    db.commit()

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

    audit = AuditLog(
        user_id=current_user.id,
        action="Deleted Decision",
        description=f"Deleted decision '{db_decision.title}'"
    )

    db.add(audit)
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


from app.models.ai_review import AIReviewResult
from app.schemas.ai_review import AIReviewOut
from app.services.ai_review_service import run_ai_review


@router.post("/{decision_id}/ai-review", response_model=AIReviewOut)
def request_ai_review(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reviewer)
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    doc_count = db.query(DecisionDocument).filter(
        DecisionDocument.decision_id == decision_id
    ).count()

    try:
        result_json = run_ai_review(decision, doc_count)
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except (RuntimeError, ValueError) as e:
        raise HTTPException(status_code=502, detail=str(e))

    ai_result = AIReviewResult(
        decision_id=decision.id,
        problem_status=result_json["problem_statement"]["status"],
        problem_note=result_json["problem_statement"]["note"],
        alternatives_status=result_json["alternatives"]["status"],
        alternatives_note=result_json["alternatives"]["note"],
        cost_status=result_json["cost_analysis"]["status"],
        cost_note=result_json["cost_analysis"]["note"],
        risk_status=result_json["risk_mitigation"]["status"],
        risk_note=result_json["risk_mitigation"]["note"],
        documents_status=result_json["supporting_documents"]["status"],
        documents_note=result_json["supporting_documents"]["note"],
        overall_summary=result_json["overall_summary"],
        requested_by=current_user.id,
    )
    db.add(ai_result)
    db.commit()
    db.refresh(ai_result)

    audit = AuditLog(
        user_id=current_user.id,
        action="Ran AI Review",
        description=f"AI review generated for decision '{decision.title}'"
    )
    db.add(audit)
    db.commit()

    return ai_result


@router.get("/{decision_id}/ai-review", response_model=list[AIReviewOut])
def get_ai_reviews(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(AIReviewResult)
        .filter(AIReviewResult.decision_id == decision_id)
        .order_by(AIReviewResult.created_at.desc())
        .all()
    )