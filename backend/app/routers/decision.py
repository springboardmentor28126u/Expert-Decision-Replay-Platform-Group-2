from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.decision import Decision
from app.schemas.decision import DecisionCreate, DecisionUpdate, DecisionOut
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/decisions", tags=["Decision Management"])


@router.post("/", response_model=DecisionOut)
def create_decision(decision: DecisionCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == current_user["email"]).first()

    new_decision = Decision(
        title=decision.title,
        problem_statement=decision.problem_statement,
        category=decision.category,
        created_by=user.id
    )
    db.add(new_decision)
    db.commit()
    db.refresh(new_decision)
    return new_decision


@router.get("/", response_model=List[DecisionOut])
def list_decisions(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Decision).all()


@router.get("/{decision_id}", response_model=DecisionOut)
def get_decision(decision_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


from app.models.decision_version import DecisionVersion

@router.put("/{decision_id}", response_model=DecisionOut)
def update_decision(decision_id: int, updates: DecisionUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    user = db.query(User).filter(User.email == current_user["email"]).first()

    # Save current state as a version BEFORE making changes
    version = DecisionVersion(
        decision_id=decision.id,
        title=decision.title,
        problem_statement=decision.problem_statement,
        category=decision.category,
        status=decision.status.value,
        changed_by=user.id
    )
    db.add(version)

    if updates.title is not None:
        decision.title = updates.title
    if updates.problem_statement is not None:
        decision.problem_statement = updates.problem_statement
    if updates.category is not None:
        decision.category = updates.category
    if updates.status is not None:
        decision.status = updates.status

    db.commit()
    db.refresh(decision)
    return decision

@router.delete("/{decision_id}")
def delete_decision(decision_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    db.delete(decision)
    db.commit()
    return {"message": "Decision deleted successfully"}
from pydantic import BaseModel
from datetime import datetime

class DecisionVersionOut(BaseModel):
    id: int
    decision_id: int
    title: str
    problem_statement: str
    category: str | None
    status: str
    changed_by: int
    changed_at: datetime

    class Config:
        from_attributes = True


@router.get("/{decision_id}/history", response_model=List[DecisionVersionOut])
def get_decision_history(decision_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    versions = db.query(DecisionVersion).filter(DecisionVersion.decision_id == decision_id).order_by(DecisionVersion.changed_at.desc()).all()
    return versions