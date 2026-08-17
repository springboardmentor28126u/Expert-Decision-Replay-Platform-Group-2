from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.ai_service import AIService


router = APIRouter(
    prefix="/api/ai",
    tags=["AI"],
)


@router.post("/decision/{decision_id}/summary")
def generate_decision_summary(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AIService(db)

    return service.generate_decision_summary(
        decision_id
    )