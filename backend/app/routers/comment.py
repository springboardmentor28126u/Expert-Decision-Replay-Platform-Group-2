from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.comment import Comment
from app.models.decision import Decision
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentOut
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/decisions/{decision_id}/comments", tags=["Discussion Module"])


@router.post("/", response_model=CommentOut)
def add_comment(decision_id: int, comment: CommentCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    user = db.query(User).filter(User.email == current_user["email"]).first()

    new_comment = Comment(
        decision_id=decision_id,
        content=comment.content,
        posted_by=user.id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


@router.get("/", response_model=List[CommentOut])
def list_comments(decision_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Comment).filter(Comment.decision_id == decision_id).order_by(Comment.posted_at.asc()).all()


@router.delete("/{comment_id}")
def delete_comment(decision_id: int, comment_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    comment = db.query(Comment).filter(Comment.id == comment_id, Comment.decision_id == decision_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully"}