from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.schemas.decision import (
    DecisionCreate,
    DecisionUpdate,
    DecisionResponse
)

from app.schemas.version import VersionCreate

from app.crud.decision import (
    create_decision,
    get_all_decisions,
    get_decision_by_id,
    update_decision,
    delete_decision
)

from app.crud.version import create_version

router = APIRouter(
    prefix="/decisions",
    tags=["Decision Management"]
)


# -----------------------------------
# Create Decision
# -----------------------------------
@router.post(
    "/",
    response_model=DecisionResponse
)
def create(
    decision: DecisionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    new_decision = create_decision(
        db,
        decision,
        current_user.id
    )

    # Save Version History
    create_version(
        db,
        VersionCreate(
            decision_id=new_decision.id,
            action="Created",
            username=current_user.full_name
        )
    )

    return new_decision


# -----------------------------------
# Get All Decisions
# -----------------------------------
@router.get(
    "/",
    response_model=list[DecisionResponse]
)
def read_all(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return get_all_decisions(db)


# -----------------------------------
# Get One Decision
# -----------------------------------
@router.get(
    "/{decision_id}",
    response_model=DecisionResponse
)
def read_one(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    decision = get_decision_by_id(
        db,
        decision_id
    )

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    return decision


# -----------------------------------
# Update Decision
# -----------------------------------
@router.put(
    "/{decision_id}",
    response_model=DecisionResponse
)
def update(
    decision_id: int,
    decision: DecisionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    updated = update_decision(
        db,
        decision_id,
        decision
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    # Save Version History
    create_version(
        db,
        VersionCreate(
            decision_id=decision_id,
            action="Updated",
            username=current_user.full_name
        )
    )

    return updated


# -----------------------------------
# Delete Decision
# -----------------------------------
@router.delete("/{decision_id}")
def delete(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    deleted = delete_decision(
        db,
        decision_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    # Save Version History
    create_version(
        db,
        VersionCreate(
            decision_id=decision_id,
            action="Deleted",
            username=current_user.full_name
        )
    )

    return {
        "message": "Decision deleted successfully"
    }