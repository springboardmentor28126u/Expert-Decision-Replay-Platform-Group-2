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

from app.core.dependencies import get_current_user

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
            Decision.created_by == current_user.id
        )
        .first()
    )

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    return decision