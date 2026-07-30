from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_user

from app.schemas.alternative import (
    AlternativeCreate,
    AlternativeUpdate,
    AlternativeResponse
)

from app.crud.alternative import (
    create_alternative,
    get_alternatives_by_decision,
    get_alternative_by_id,
    update_alternative,
    delete_alternative
)

router = APIRouter(
    prefix="/alternatives",
    tags=["Alternative Comparison"]
)


# ----------------------------------------
# Create Alternative
# ----------------------------------------
@router.post(
    "/",
    response_model=AlternativeResponse
)
def create_new_alternative(
    alternative: AlternativeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return create_alternative(db, alternative)


# ----------------------------------------
# Get All Alternatives of a Decision
# ----------------------------------------
@router.get(
    "/decision/{decision_id}",
    response_model=List[AlternativeResponse]
)
def get_all_alternatives(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return get_alternatives_by_decision(
        db,
        decision_id
    )


# ----------------------------------------
# Get Alternative By ID
# ----------------------------------------
@router.get(
    "/{alternative_id}",
    response_model=AlternativeResponse
)
def get_alternative(
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    alternative = get_alternative_by_id(
        db,
        alternative_id
    )

    if not alternative:
        raise HTTPException(
            status_code=404,
            detail="Alternative not found"
        )

    return alternative


# ----------------------------------------
# Update Alternative
# ----------------------------------------
@router.put(
    "/{alternative_id}",
    response_model=AlternativeResponse
)
def update_existing_alternative(
    alternative_id: int,
    alternative: AlternativeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    updated = update_alternative(
        db,
        alternative_id,
        alternative
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Alternative not found"
        )

    return updated


# ----------------------------------------
# Delete Alternative
# ----------------------------------------
@router.delete(
    "/{alternative_id}"
)
def delete_existing_alternative(
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    deleted = delete_alternative(
        db,
        alternative_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Alternative not found"
        )

    return deleted