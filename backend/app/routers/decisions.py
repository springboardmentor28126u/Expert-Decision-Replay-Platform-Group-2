from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import (
    get_current_user,
    require_employee,
    require_manager,
    require_admin
)
from app import crud, schemas

router = APIRouter(
    prefix="/decisions",
    tags=["Decision Management"]
)

# =====================================================
# CREATE DECISION
# Employee, Reviewer, Manager & Administrator
# =====================================================

@router.post(
    "/",
    response_model=schemas.DecisionResponse
)
def create_decision(

    decision: schemas.DecisionCreate,

    db: Session = Depends(get_db),

    current_user=Depends(require_employee)

):

    return crud.create_decision(

        db,

        decision,

        current_user

    )


# =====================================================
# GET ALL DECISIONS
# All Logged-in Users
# =====================================================

@router.get(
    "/",
    response_model=list[schemas.DecisionResponse]
)
def get_all_decisions(

    db: Session = Depends(get_db),

    current_user=Depends(require_employee)

):

    return crud.get_all_decisions(db)


# =====================================================
# GET DECISION BY ID
# All Logged-in Users
# =====================================================

@router.get(
    "/{decision_id}",
    response_model=schemas.DecisionResponse
)
def get_decision(

    decision_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_employee)

):

    decision = crud.get_decision_by_id(

        db,

        decision_id

    )

    if not decision:

        raise HTTPException(

            status_code=404,

            detail="Decision not found"

        )

    return decision


# =====================================================
# UPDATE DECISION
# Employee & Reviewer -> Own Decisions Only
# Manager & Administrator -> Any Decision
# =====================================================

@router.put("/{decision_id}",
            response_model=schemas.DecisionResponse)
def update_decision(

    decision_id: int,

    decision: schemas.DecisionUpdate,

    db: Session = Depends(get_db),

    current_user=Depends(require_employee)

):

    # Employee can edit only own decision

    if current_user.role == "Employee":

        if not crud.is_decision_owner(

            db,

            decision_id,

            current_user.id

        ):

            raise HTTPException(

                status_code=403,

                detail="You can edit only your own decisions."

            )

    # Reviewer cannot edit

    if current_user.role == "Reviewer":

        raise HTTPException(

            status_code=403,

            detail="Reviewer cannot edit decisions."

        )

    updated = crud.update_decision(

        db,

        decision_id,

        decision,

        current_user


    )

    if not updated:

        raise HTTPException(

            status_code=404,

            detail="Decision not found"

        )

    return updated
# =====================================================
# DELETE DECISION
# Employee & Reviewer -> Own Decisions Only
# Manager & Administrator -> Any Decision
# =====================================================

@router.delete("/{decision_id}")
def delete_decision(

    decision_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_manager)

):

    deleted = crud.delete_decision(

        db,

        decision_id,

        current_user

    )

    if not deleted:

        raise HTTPException(

            status_code=404,

            detail="Decision not found"

        )

    return {

        "message": "Decision deleted successfully"

    }