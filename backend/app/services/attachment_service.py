"""
services/attachment_service.py

Business logic for file attachments.
"""

from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attachment import Attachment
from app.repositories.alternative_repository import AlternativeRepository
from app.repositories.attachment_repository import AttachmentRepository
from app.repositories.comment_repository import CommentRepository
from app.repositories.decision_repository import DecisionRepository
from app.schemas.attachment import AttachmentOut
from app.utils.exceptions import NotFoundException, ValidationException

UPLOAD_DIR = Path("uploads")


class AttachmentService:

    def __init__(
        self,
        db: AsyncSession,
    ) -> None:

        self.db = db

        self.attachments = AttachmentRepository(db)
        self.decisions = DecisionRepository(db)
        self.alternatives = AlternativeRepository(db)
        self.comments = CommentRepository(db)

        UPLOAD_DIR.mkdir(exist_ok=True)

    async def upload_to_decision(
        self,
        decision_id: uuid.UUID,
        uploaded_by_id: uuid.UUID,
        file: UploadFile,
    ) -> AttachmentOut:

        decision = await self.decisions.get_by_id(decision_id)

        if decision is None:
            raise NotFoundException("Decision not found.")

        attachment = await self._save_file(
            file=file,
            uploaded_by_id=uploaded_by_id,
            decision_id=decision_id,
        )

        return AttachmentOut.model_validate(attachment)

    async def upload_to_alternative(
        self,
        alternative_id: uuid.UUID,
        uploaded_by_id: uuid.UUID,
        file: UploadFile,
    ) -> AttachmentOut:

        alternative = await self.alternatives.get_by_id(alternative_id)

        if alternative is None:
            raise NotFoundException("Alternative not found.")

        attachment = await self._save_file(
            file=file,
            uploaded_by_id=uploaded_by_id,
            alternative_id=alternative_id,
        )

        return AttachmentOut.model_validate(attachment)

    async def upload_to_comment(
        self,
        comment_id: uuid.UUID,
        uploaded_by_id: uuid.UUID,
        file: UploadFile,
    ) -> AttachmentOut:

        comment = await self.comments.get_by_id(comment_id)

        if comment is None:
            raise NotFoundException("Comment not found.")

        attachment = await self._save_file(
            file=file,
            uploaded_by_id=uploaded_by_id,
            comment_id=comment_id,
        )

        return AttachmentOut.model_validate(attachment)

    async def _save_file(
        self,
        *,
        file: UploadFile,
        uploaded_by_id: uuid.UUID,
        decision_id: uuid.UUID | None = None,
        alternative_id: uuid.UUID | None = None,
        comment_id: uuid.UUID | None = None,
    ) -> Attachment:

        if file.filename is None:
            raise ValidationException("Filename is required.")

        extension = Path(file.filename).suffix

        stored_name = f"{uuid.uuid4()}{extension}"

        destination = UPLOAD_DIR / stored_name

        with destination.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        size = destination.stat().st_size

        attachment = Attachment(
            decision_id=decision_id,
            alternative_id=alternative_id,
            comment_id=comment_id,
            uploaded_by_id=uploaded_by_id,
            file_name=file.filename,
            file_path=str(destination),
            file_type=file.content_type or "application/octet-stream",
            file_size=size,
        )

        self.attachments.add(attachment)

        await self.db.commit()

        await self.attachments.refresh(attachment)

        return attachment

    async def get_attachment(
        self,
        attachment_id: uuid.UUID,
    ) -> AttachmentOut:

        attachment = await self.attachments.get_by_id(attachment_id)

        if attachment is None:
            raise NotFoundException("Attachment not found.")

        return AttachmentOut.model_validate(attachment)

    async def list_for_decision(
        self,
        decision_id: uuid.UUID,
    ) -> list[AttachmentOut]:

        attachments = await self.attachments.list_for_decision(decision_id)

        return [
            AttachmentOut.model_validate(a)
            for a in attachments
        ]

    async def list_for_alternative(
        self,
        alternative_id: uuid.UUID,
    ) -> list[AttachmentOut]:

        attachments = await self.attachments.list_for_alternative(alternative_id)

        return [
            AttachmentOut.model_validate(a)
            for a in attachments
        ]

    async def list_for_comment(
        self,
        comment_id: uuid.UUID,
    ) -> list[AttachmentOut]:

        attachments = await self.attachments.list_for_comment(comment_id)

        return [
            AttachmentOut.model_validate(a)
            for a in attachments
        ]

    async def delete_attachment(
        self,
        attachment_id: uuid.UUID,
    ) -> None:

        attachment = await self.attachments.get_by_id(attachment_id)

        if attachment is None:
            raise NotFoundException("Attachment not found.")

        await self.attachments.soft_delete(attachment)

        await self.db.commit()
