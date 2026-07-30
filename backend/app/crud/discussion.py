from sqlalchemy.orm import Session

from app.models.discussion import Discussion
from app.schemas.discussion import DiscussionCreate


def create_discussion(db: Session, discussion: DiscussionCreate):

    new_discussion = Discussion(
        decision_id=discussion.decision_id,
        username=discussion.username,
        message=discussion.message,
    )

    db.add(new_discussion)
    db.commit()
    db.refresh(new_discussion)

    return new_discussion


def get_discussions_by_decision(db: Session, decision_id: int):

    return (
        db.query(Discussion)
        .filter(Discussion.decision_id == decision_id)
        .order_by(Discussion.created_at.desc())
        .all()
    )


def get_discussion(db: Session, discussion_id: int):

    return (
        db.query(Discussion)
        .filter(Discussion.id == discussion_id)
        .first()
    )


def delete_discussion(db: Session, discussion_id: int):

    discussion = get_discussion(db, discussion_id)

    if discussion:
        db.delete(discussion)
        db.commit()

    return discussion