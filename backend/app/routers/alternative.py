from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import (
    require_employee,
    require_manager,
    require_alternative_creator
)
from app.models import User, Decision, AlternativeAnalysis
from app.schemas import (
    AlternativeCreate,
    AlternativeUpdate,
    AlternativeResponse
)


router = APIRouter(
    prefix="/alternatives",
    tags=["Alternative Analysis"]
)


# =====================================================
# CREATE ALTERNATIVE
# Employee, Reviewer, Manager & Administrator
# =====================================================

@router.post(
    "/",
    response_model=AlternativeResponse
)
def create_alternative(

    alternative: AlternativeCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(require_alternative_creator)
):

    decision = db.query(Decision).filter(
        Decision.id == alternative.decision_id
    ).first()

    if not decision:

        raise HTTPException(
            status_code=404,
            detail="Decision not found."
        )

    new_alternative = AlternativeAnalysis(

        decision_id=alternative.decision_id,

        alternative_name=alternative.alternative_name,

        description=alternative.description,

        advantages=alternative.advantages,

        disadvantages=alternative.disadvantages,

        estimated_cost=alternative.estimated_cost,

        risk_level=alternative.risk_level,

        score=alternative.score

    )

    db.add(new_alternative)

    db.commit()

    db.refresh(new_alternative)

    return new_alternative


# =====================================================
# GET ALL ALTERNATIVES
# Employee, Reviewer, Manager & Administrator
# =====================================================

@router.get(
    "/",
    response_model=list[AlternativeResponse]
)
def get_alternatives(

    db: Session = Depends(get_db),

    current_user: User = Depends(require_employee)

):

    return db.query(
        AlternativeAnalysis
    ).all()


# =====================================================
# GET SINGLE ALTERNATIVE
# Employee, Reviewer, Manager & Administrator
# =====================================================

@router.get(
    "/{alternative_id}",
    response_model=AlternativeResponse
)
def get_alternative(

    alternative_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(require_employee)

):

    alternative = db.query(
        AlternativeAnalysis
    ).filter(
        AlternativeAnalysis.id == alternative_id
    ).first()

    if not alternative:

        raise HTTPException(
            status_code=404,
            detail="Alternative not found."
        )

    return alternative


# =====================================================
# UPDATE ALTERNATIVE
# Manager & Administrator
# =====================================================

@router.put(
    "/{alternative_id}",
    response_model=AlternativeResponse
)
def update_alternative(

    alternative_id: int,

    alternative: AlternativeUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(require_manager)

):

    db_alternative = db.query(
        AlternativeAnalysis
    ).filter(
        AlternativeAnalysis.id == alternative_id
    ).first()

    if not db_alternative:

        raise HTTPException(
            status_code=404,
            detail="Alternative not found."
        )

    # -------------------------------------------------
    # Validate Decision
    # -------------------------------------------------

    decision = db.query(Decision).filter(
        Decision.id == alternative.decision_id
    ).first()

    if not decision:

        raise HTTPException(
            status_code=404,
            detail="Decision not found."
        )

    # -------------------------------------------------
    # Update
    # -------------------------------------------------

    db_alternative.decision_id = (
        alternative.decision_id
    )

    db_alternative.alternative_name = (
        alternative.alternative_name
    )

    db_alternative.description = (
        alternative.description
    )

    db_alternative.advantages = (
        alternative.advantages
    )

    db_alternative.disadvantages = (
        alternative.disadvantages
    )

    db_alternative.estimated_cost = (
        alternative.estimated_cost
    )

    db_alternative.risk_level = (
        alternative.risk_level
    )

    db_alternative.score = (
        alternative.score
    )

    db.commit()

    db.refresh(db_alternative)

    return db_alternative


# =====================================================
# DELETE ALTERNATIVE
# Manager & Administrator
# =====================================================

@router.delete(
    "/{alternative_id}"
)
def delete_alternative(

    alternative_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(require_manager)

):

    alternative = db.query(
        AlternativeAnalysis
    ).filter(
        AlternativeAnalysis.id == alternative_id
    ).first()

    if not alternative:

        raise HTTPException(
            status_code=404,
            detail="Alternative not found."
        )

    db.delete(alternative)

    db.commit()

    return {
        "message": "Alternative deleted successfully."
    }