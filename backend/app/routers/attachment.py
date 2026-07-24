"""
routers/attachment.py

Attachment upload/download endpoints.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.attachment import AttachmentOut
from app.services.attachment_service import AttachmentService

router = APIRouter()


def get_attachment_service(
    db: AsyncSession = Depends(get_db),
) -> AttachmentService:
    return AttachmentService(db)


# ---------------------------------------------------------------------
# Uploads
# ---------------------------------------------------------------------


@router.post(
    "/decision/{decision_id}",
    response_model=AttachmentOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_to_decision(
    decision_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    service: AttachmentService = Depends(get_attachment_service),
) -> AttachmentOut:

    return await service.upload_to_decision(
        decision_id=decision_id,
        uploaded_by_id=current_user.id,
        file=file,
    )


@router.post(
    "/alternative/{alternative_id}",
    response_model=AttachmentOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_to_alternative(
    alternative_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    service: AttachmentService = Depends(get_attachment_service),
) -> AttachmentOut:

    return await service.upload_to_alternative(
        alternative_id=alternative_id,
        uploaded_by_id=current_user.id,
        file=file,
    )


@router.post(
    "/comment/{comment_id}",
    response_model=AttachmentOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_to_comment(
    comment_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    service: AttachmentService = Depends(get_attachment_service),
) -> AttachmentOut:

    return await service.upload_to_comment(
        comment_id=comment_id,
        uploaded_by_id=current_user.id,
        file=file,
    )


# ---------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------


@router.get(
    "/{attachment_id}",
    response_model=AttachmentOut,
)
async def get_attachment(
    attachment_id: uuid.UUID,
    service: AttachmentService = Depends(get_attachment_service),
) -> AttachmentOut:

    return await service.get_attachment(attachment_id)


@router.get(
    "/decision/{decision_id}",
    response_model=list[AttachmentOut],
)
async def list_decision_attachments(
    decision_id: uuid.UUID,
    service: AttachmentService = Depends(get_attachment_service),
) -> list[AttachmentOut]:

    return await service.list_for_decision(decision_id)


@router.get(
    "/alternative/{alternative_id}",
    response_model=list[AttachmentOut],
)
async def list_alternative_attachments(
    alternative_id: uuid.UUID,
    service: AttachmentService = Depends(get_attachment_service),
) -> list[AttachmentOut]:

    return await service.list_for_alternative(alternative_id)


@router.get(
    "/comment/{comment_id}",
    response_model=list[AttachmentOut],
)
async def list_comment_attachments(
    comment_id: uuid.UUID,
    service: AttachmentService = Depends(get_attachment_service),
) -> list[AttachmentOut]:

    return await service.list_for_comment(comment_id)


# ---------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------


@router.delete(
    "/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_attachment(
    attachment_id: uuid.UUID,
    service: AttachmentService = Depends(get_attachment_service),
) -> None:

    await service.delete_attachment(attachment_id)
