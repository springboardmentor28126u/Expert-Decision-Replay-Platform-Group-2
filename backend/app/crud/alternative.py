from sqlalchemy.orm import Session

from app.models.alternative import Alternative
from app.schemas.alternative import (
    AlternativeCreate,
    AlternativeUpdate
)


# ----------------------------------------
# Create Alternative
# ----------------------------------------
def create_alternative(
    db: Session,
    alternative: AlternativeCreate
):

    db_alternative = Alternative(
        decision_id=alternative.decision_id,
        title=alternative.title,
        description=alternative.description,
        pros=alternative.pros,
        cons=alternative.cons,
        score=alternative.score
    )

    db.add(db_alternative)

    db.commit()

    db.refresh(db_alternative)

    return db_alternative


# ----------------------------------------
# Get All Alternatives for a Decision
# ----------------------------------------
def get_alternatives_by_decision(
    db: Session,
    decision_id: int
):

    return db.query(Alternative).filter(
        Alternative.decision_id == decision_id
    ).all()


# ----------------------------------------
# Get Alternative By ID
# ----------------------------------------
def get_alternative_by_id(
    db: Session,
    alternative_id: int
):

    return db.query(Alternative).filter(
        Alternative.id == alternative_id
    ).first()


# ----------------------------------------
# Update Alternative
# ----------------------------------------
def update_alternative(
    db: Session,
    alternative_id: int,
    alternative: AlternativeUpdate
):

    db_alternative = get_alternative_by_id(
        db,
        alternative_id
    )

    if not db_alternative:
        return None

    db_alternative.title = alternative.title
    db_alternative.description = alternative.description
    db_alternative.pros = alternative.pros
    db_alternative.cons = alternative.cons
    db_alternative.score = alternative.score

    db.commit()

    db.refresh(db_alternative)

    return db_alternative


# ----------------------------------------
# Delete Alternative
# ----------------------------------------
def delete_alternative(
    db: Session,
    alternative_id: int
):

    db_alternative = get_alternative_by_id(
        db,
        alternative_id
    )

    if not db_alternative:
        return None

    db.delete(db_alternative)

    db.commit()

    return {
        "message": "Alternative deleted successfully"
    }