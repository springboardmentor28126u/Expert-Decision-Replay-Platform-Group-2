"""
routers/comment.py

Endpoints for decision discussions.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.comment import (
    CommentCreate,
    CommentOut,
    CommentThreadOut,
    CommentUpdate,
)
from app.services.comment_service import CommentService

router = APIRouter()


def get_comment_service(
    db: AsyncSession = Depends(get_db),
) -> CommentService:
    return CommentService(db)


# --------------------------------------------------
# Queries
# --------------------------------------------------


@router.get(
    "/decision/{decision_id}",
    response_model=list[CommentThreadOut],
)
async def list_comments(
    decision_id: uuid.UUID,
    service: CommentService = Depends(get_comment_service),
) -> list[CommentThreadOut]:

    return await service.list_comments(decision_id)


@router.get(
    "/{comment_id}",
    response_model=CommentOut,
)
async def get_comment(
    comment_id: uuid.UUID,
    service: CommentService = Depends(get_comment_service),
) -> CommentOut:

    return await service.get_comment(comment_id)


# --------------------------------------------------
# Create
# --------------------------------------------------


@router.post(
    "/decision/{decision_id}",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(
    decision_id: uuid.UUID,
    payload: CommentCreate,
    current_user: User = Depends(get_current_user),
    service: CommentService = Depends(get_comment_service),
) -> CommentOut:

    return await service.create_comment(
        decision_id=decision_id,
        payload=payload,
        current_user=current_user,
    )


# --------------------------------------------------
# Update
# --------------------------------------------------


@router.put(
    "/{comment_id}",
    response_model=CommentOut,
)
async def update_comment(
    comment_id: uuid.UUID,
    payload: CommentUpdate,
    current_user: User = Depends(get_current_user),
    service: CommentService = Depends(get_comment_service),
) -> CommentOut:

    return await service.update_comment(
        comment_id=comment_id,
        payload=payload,
        current_user=current_user,
    )


# --------------------------------------------------
# Delete
# --------------------------------------------------


@router.delete(
    "/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_comment(
    comment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: CommentService = Depends(get_comment_service),
) -> None:

    await service.delete_comment(
        comment_id=comment_id,
        current_user=current_user,
    )
