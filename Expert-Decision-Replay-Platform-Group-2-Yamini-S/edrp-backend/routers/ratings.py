from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_db, get_current_user
from models import User, Decision, Rating
from schemas import RatingCreate, RatingSummaryOut
from helpers import notify, log_action

router = APIRouter(prefix="/decisions", tags=["Ratings"])


def build_summary(decision_id: int, current_user: User, db: Session) -> RatingSummaryOut:
    ratings = db.query(Rating).filter(Rating.decision_id == decision_id).all()

    count = len(ratings)
    average = round(sum(r.stars for r in ratings) / count, 1) if count else 0.0
    my_rating = next((r.stars for r in ratings if r.rater_id == current_user.id), None)

    return RatingSummaryOut(average=average, count=count, my_rating=my_rating)


@router.get("/{decision_id}/ratings", response_model=RatingSummaryOut)
def get_ratings(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return build_summary(decision_id, current_user, db)


@router.post("/{decision_id}/ratings", response_model=RatingSummaryOut, status_code=201)
def rate_decision(
    decision_id: int,
    payload: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.stars < 1 or payload.stars > 5:
        raise HTTPException(status_code=400, detail="Stars must be between 1 and 5")

    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    existing = (
        db.query(Rating)
        .filter(Rating.decision_id == decision_id, Rating.rater_id == current_user.id)
        .first()
    )

    if existing:
        existing.stars = payload.stars
    else:
        db.add(Rating(decision_id=decision_id, rater_id=current_user.id, stars=payload.stars))

        if decision.created_by != current_user.id:
            notify(
                db,
                user_id=decision.created_by,
                message=f"{current_user.name} rated '{decision.title}' {payload.stars} stars.",
                link=f"/decisions/{decision.id}",
            )

    log_action(
        db,
        actor_id=current_user.id,
        action="decision_rated",
        entity_type="Decision",
        entity_id=decision_id,
        details=f"{payload.stars} stars",
    )

    db.commit()
    return build_summary(decision_id, current_user, db)