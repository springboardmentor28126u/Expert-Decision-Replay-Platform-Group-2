from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.alternative import Alternative
from app.models.decision import Decision
from app.models.user import User
from app.schemas.alternative import (
    AlternativeCreate,
    AlternativeUpdate,
    AlternativeResponse
)
from app.core.dependencies import get_current_user


router = APIRouter(
    prefix="/alternatives",
    tags=["Alternative Analysis"]
)


@router.post("/{decision_id}", response_model=AlternativeResponse)
def create_alternative(
    decision_id: int,
    alternative: AlternativeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    decision = db.query(Decision).filter(
        Decision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    new_alternative = Alternative(
        decision_id=decision_id,
        option_name=alternative.option_name,
        pros=alternative.pros,
        cons=alternative.cons,
        estimated_cost=alternative.estimated_cost,
        feasibility=alternative.feasibility,
        risk_level=alternative.risk_level
    )

    db.add(new_alternative)
    db.commit()
    db.refresh(new_alternative)

    return new_alternative

@router.get("/{decision_id}", response_model=list[AlternativeResponse])
def get_alternatives(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alternatives = (
        db.query(Alternative)
        .filter(Alternative.decision_id == decision_id)
        .all()
    )

    return alternatives

@router.put("/{alternative_id}", response_model=AlternativeResponse)
def update_alternative(
    alternative_id: int,
    alternative: AlternativeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_alternative = (
        db.query(Alternative)
        .filter(Alternative.id == alternative_id)
        .first()
    )

    if not db_alternative:
        raise HTTPException(status_code=404, detail="Alternative not found")

    db_alternative.option_name = alternative.option_name
    db_alternative.pros = alternative.pros
    db_alternative.cons = alternative.cons
    db_alternative.estimated_cost = alternative.estimated_cost
    db_alternative.feasibility = alternative.feasibility
    db_alternative.risk_level = alternative.risk_level

    db.commit()
    db.refresh(db_alternative)

    return db_alternative

@router.delete("/{alternative_id}")
def delete_alternative(
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_alternative = (
        db.query(Alternative)
        .filter(Alternative.id == alternative_id)
        .first()
    )

    if not db_alternative:
        raise HTTPException(status_code=404, detail="Alternative not found")

    db.delete(db_alternative)
    db.commit()

    return {
        "message": "Alternative deleted successfully"
    }