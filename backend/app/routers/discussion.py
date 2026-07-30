from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.discussion import Discussion

from app.schemas.discussion import (
    DiscussionCreate,
    DiscussionResponse,
)

from app.crud.discussion import (
    create_discussion,
    get_discussions_by_decision,
    get_discussion,
    delete_discussion,
)

router = APIRouter(
    prefix="/discussions",
    tags=["Discussions"],
)


# Add Discussion
@router.post("/", response_model=DiscussionResponse)
def add_discussion(
    discussion: DiscussionCreate,
    db: Session = Depends(get_db),
):
    return create_discussion(db, discussion)


# Get ALL Discussions (for repository page)
@router.get("/", response_model=List[DiscussionResponse])
def get_all_discussions(
    db: Session = Depends(get_db)
):
    return db.query(Discussion).all()


# Get discussions by decision
@router.get("/{decision_id}", response_model=List[DiscussionResponse])
def get_discussions(
    decision_id: int,
    db: Session = Depends(get_db),
):
    return get_discussions_by_decision(
        db,
        decision_id
    )


# Delete discussion
@router.delete("/{discussion_id}")
def remove_discussion(
    discussion_id: int,
    db: Session = Depends(get_db),
):

    discussion = get_discussion(
        db,
        discussion_id
    )

    if not discussion:
        raise HTTPException(
            status_code=404,
            detail="Discussion not found",
        )

    delete_discussion(
        db,
        discussion_id
    )

    return {
        "message": "Discussion deleted successfully"
    }