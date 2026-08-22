from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app import crud

router = APIRouter(
    prefix="/versions",
    tags=["Version Tracking"]
)


# ==========================================
# Get Version History of a Decision
# ==========================================

@router.get("/{decision_id}")
def get_version_history(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return crud.get_versions(
        db,
        decision_id
    )