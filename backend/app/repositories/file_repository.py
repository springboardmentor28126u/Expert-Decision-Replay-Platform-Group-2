"""File attachment repository — data access for file_attachments table."""

from typing import List

from sqlalchemy.orm import Session, joinedload

from app.models.file_attachment import FileAttachment
from app.repositories.base import BaseRepository


class FileRepository(BaseRepository[FileAttachment]):
    """Repository for file attachment data operations."""

    def __init__(self, db: Session):
        super().__init__(FileAttachment, db)

    def get_by_decision_id(self, decision_id: int) -> List[FileAttachment]:
        """Get all file attachments for a decision."""
        return (
            self.db.query(FileAttachment)
            .options(joinedload(FileAttachment.uploader))
            .filter(FileAttachment.decision_id == decision_id)
            .order_by(FileAttachment.created_at.desc())
            .all()
        )
