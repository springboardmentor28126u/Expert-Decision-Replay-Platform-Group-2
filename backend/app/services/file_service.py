"""File service — file upload, download, and deletion with pluggable storage."""

import logging
import uuid
from typing import List

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.config import get_settings
from app.exceptions.handlers import (
    NotFoundException,
    FileTooLargeException,
)
from app.models.file_attachment import FileAttachment
from app.models.user import User
from app.repositories.file_repository import FileRepository
from app.storage.base import StorageBackend

from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)
settings = get_settings()


class FileService:
    """Service handling file upload business logic."""

    def __init__(self, db: Session, storage: StorageBackend):
        self.file_repo = FileRepository(db)
        self.storage = storage
        self.audit_service = AuditService(db)

    async def upload_file(
        self, decision_id: int, file: UploadFile, user: User
    ) -> FileAttachment:
        """Upload a file and create a metadata record."""
        # Read file content
        content = await file.read()
        size_bytes = len(content)

        # Check file size
        max_size = settings.max_file_size_mb * 1024 * 1024
        if size_bytes > max_size:
            raise FileTooLargeException(
                f"File size ({size_bytes} bytes) exceeds limit ({settings.max_file_size_mb} MB)"
            )

        # Generate unique filename to avoid collisions
        ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else ""
        unique_name = f"{uuid.uuid4().hex}.{ext}" if ext else uuid.uuid4().hex

        # Save to storage
        import io
        file_obj = io.BytesIO(content)
        filepath = self.storage.save(
            file=file_obj,
            filename=unique_name,
            subfolder=str(decision_id),
        )

        # Create metadata record
        attachment = FileAttachment(
            decision_id=decision_id,
            filename=file.filename,
            filepath=filepath,
            content_type=file.content_type,
            size_bytes=size_bytes,
            uploaded_by=user.id,
        )
        attachment = self.file_repo.create(attachment)
        logger.info(f"File uploaded: {file.filename} for decision {decision_id}")

        self.audit_service.log_file_uploaded(
            user_id=user.id,
            decision_id=decision_id,
            filename=file.filename,
        )
        return attachment

    def get_files(self, decision_id: int) -> List[FileAttachment]:
        """Get all file attachments for a decision."""
        return self.file_repo.get_by_decision_id(decision_id)

    def get_file(self, file_id: int) -> FileAttachment:
        """Get a single file attachment by ID."""
        attachment = self.file_repo.get_by_id(file_id)
        if not attachment:
            raise NotFoundException(f"File with ID {file_id} not found")
        return attachment

    def get_file_path(self, file_id: int) -> str:
        """Get the absolute path to a file for download."""
        attachment = self.get_file(file_id)
        path = self.storage.get(attachment.filepath)
        if not path:
            raise NotFoundException("File not found on disk")
        return path

    def delete_file(self, file_id: int) -> None:
        """Delete a file from storage and database."""
        attachment = self.get_file(file_id)
        self.storage.delete(attachment.filepath)
        self.file_repo.delete(attachment)
        logger.info(f"File {file_id} deleted")
