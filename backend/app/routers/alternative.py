from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.alternative import Alternative
from app.models.decision import Decision
from app.models.user import User
from app.schemas.alternative import AlternativeCreate, AlternativeUpdate, AlternativeOut
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/decisions/{decision_id}/alternatives", tags=["Alternative Analysis"])


@router.post("/", response_model=AlternativeOut)
def create_alternative(decision_id: int, alt: AlternativeCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    user = db.query(User).filter(User.email == current_user["email"]).first()

    new_alt = Alternative(
        decision_id=decision_id,
        title=alt.title,
        pros=alt.pros,
        cons=alt.cons,
        estimated_cost=alt.estimated_cost,
        risk_assessment=alt.risk_assessment,
        created_by=user.id
    )
    db.add(new_alt)
    db.commit()
    db.refresh(new_alt)
    return new_alt


@router.get("/", response_model=List[AlternativeOut])
def list_alternatives(decision_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Alternative).filter(Alternative.decision_id == decision_id).all()


@router.put("/{alt_id}", response_model=AlternativeOut)
def update_alternative(decision_id: int, alt_id: int, updates: AlternativeUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    alt = db.query(Alternative).filter(Alternative.id == alt_id, Alternative.decision_id == decision_id).first()
    if not alt:
        raise HTTPException(status_code=404, detail="Alternative not found")

    if updates.title is not None:
        alt.title = updates.title
    if updates.pros is not None:
        alt.pros = updates.pros
    if updates.cons is not None:
        alt.cons = updates.cons
    if updates.estimated_cost is not None:
        alt.estimated_cost = updates.estimated_cost
    if updates.risk_assessment is not None:
        alt.risk_assessment = updates.risk_assessment

    db.commit()
    db.refresh(alt)
    return alt


@router.delete("/{alt_id}")
def delete_alternative(decision_id: int, alt_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    alt = db.query(Alternative).filter(Alternative.id == alt_id, Alternative.decision_id == decision_id).first()
    if not alt:
        raise HTTPException(status_code=404, detail="Alternative not found")

    db.delete(alt)
    db.commit()
    return {"message": "Alternative deleted successfully"}