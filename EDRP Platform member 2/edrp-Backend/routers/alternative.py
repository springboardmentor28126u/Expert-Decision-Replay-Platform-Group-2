from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import Alternative
from schemas import AlternativeUpdate, AlternativeOut
from auth import get_current_user, get_db

router = APIRouter()

@router.patch("/{alternative_id}", response_model=AlternativeOut)
def update_alternative(
    alternative_id: int,
    alt_update: AlternativeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_alt = db.query(Alternative).filter(Alternative.id == alternative_id).first()
    if not db_alt:
        raise HTTPException(status_code=404, detail="Alternative not found")

    # If marking as selected, unselect others under the same decision
    if alt_update.is_selected:
        db.query(Alternative).filter(
            Alternative.decision_id == db_alt.decision_id,
            Alternative.id != alternative_id
        ).update({Alternative.is_selected: False})

    # Update provided fields
    update_data = alt_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_alt, key, value)

    db.commit()
    db.refresh(db_alt)
    return db_alt

@router.delete("/{alternative_id}", response_model=dict)
def delete_alternative(
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_alt = db.query(Alternative).filter(Alternative.id == alternative_id).first()
    if not db_alt:
        raise HTTPException(status_code=404, detail="Alternative not found")

    db.delete(db_alt)
    db.commit()
    return {"detail": "Alternative deleted"}
@router.get("/{alternative_id}", response_model=AlternativeOut)
def get_alternative(
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    alternative = db.query(Alternative).filter(
        Alternative.id == alternative_id
    ).first()

    if not alternative:
        raise HTTPException(
            status_code=404,
            detail="Alternative not found"
        )

    return alternative