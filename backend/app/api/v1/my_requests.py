"""
Expert Decision Replay Platform - Current User Request Router
"""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.group import GroupJoinRequestResponse
from app.services.group_service import GroupService

router = APIRouter()


@router.get("", response_model=List[GroupJoinRequestResponse])
def list_my_join_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all group join requests created by the current user."""
    return GroupService.list_my_join_requests(db=db, current_user=current_user)
