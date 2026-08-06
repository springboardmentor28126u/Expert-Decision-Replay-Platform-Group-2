from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.comment import Comment
from app.models.decision import Decision
from app.models.user import User
from app.schemas.comment import (
    CommentCreate,
    CommentUpdate,
    CommentResponse
)
from app.core.dependencies import get_current_user

router = APIRouter(
    prefix="/comments",
    tags=["Discussion Module"]
)


@router.post("/{decision_id}", response_model=CommentResponse)
def create_comment(
    decision_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    new_comment = Comment(
        decision_id=decision_id,
        user_id=current_user.id,
        comment=comment.comment
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return {
        "id": new_comment.id,
        "decision_id": new_comment.decision_id,
        "user_id": new_comment.user_id,
        "comment": new_comment.comment,
        "created_at": new_comment.created_at,
        "user_name": current_user.full_name,
        "user_role": current_user.role,
    }


@router.get("/{decision_id}", response_model=list[CommentResponse])
def get_comments(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comments = (
        db.query(Comment)
        .filter(Comment.decision_id == decision_id)
        .all()
    )

    result = []
    for c in comments:
        user = db.query(User).filter(User.id == c.user_id).first()
        result.append({
            "id": c.id,
            "decision_id": c.decision_id,
            "user_id": c.user_id,
            "comment": c.comment,
            "created_at": c.created_at,
            "user_name": user.full_name if user else "Unknown",
            "user_role": user.role if user else "Unknown",
        })
    return result

@router.put("/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    comment: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()

    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if db_comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db_comment.comment = comment.comment

    db.commit()
    db.refresh(db_comment)

    return db_comment