from sqlalchemy.orm import Session

from app.models.decision import Decision
from app.schemas.decision import DecisionCreate


def create_decision(
    db: Session,
    decision: DecisionCreate,
    user_id: int
):

    db_decision = Decision(
        title=decision.title,
        description=decision.description,
        status=decision.status,
        created_by=user_id
    )

    db.add(db_decision)
    db.commit()
    db.refresh(db_decision)

    return db_decision


def get_all_decisions(db: Session):
    return db.query(Decision).all()


def get_decision_by_id(
    db: Session,
    decision_id: int
):
    return db.query(Decision).filter(
        Decision.id == decision_id
    ).first()


def update_decision(
    db: Session,
    decision_id: int,
    decision: DecisionCreate
):

    db_decision = get_decision_by_id(
        db,
        decision_id
    )

    if not db_decision:
        return None

    db_decision.title = decision.title
    db_decision.description = decision.description
    db_decision.status = decision.status

    db.commit()
    db.refresh(db_decision)

    return db_decision


def delete_decision(
    db: Session,
    decision_id: int
):

    db_decision = get_decision_by_id(
        db,
        decision_id
    )

    if not db_decision:
        return None

    db.delete(db_decision)
    db.commit()

    return db_decision