"""
schemas/attachment.py

Note: there is deliberately no AttachmentCreate body schema. Uploads
arrive as multipart/form-data (UploadFile) at the router level, with
decision_id/alternative_id/comment_id passed as form fields — the
service layer builds the ORM object directly from the upload rather
than a JSON request body, since a Pydantic schema can't usefully
validate raw file bytes anyway.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMBase


class AttachmentUploaderSummary(ORMBase):
    id: uuid.UUID
    full_name: str


class AttachmentOut(ORMBase):
    id: uuid.UUID
    decision_id: uuid.UUID | None = None
    alternative_id: uuid.UUID | None = None
    comment_id: uuid.UUID | None = None
    file_name: str
    file_type: str
    file_size: int
    created_at: datetime
    uploaded_by: AttachmentUploaderSummary


class AttachmentDownloadURL(BaseModel):
    """
    Returned by GET /attachments/{id}/download — a short-lived signed
    URL to the underlying object storage, rather than proxying file
    bytes through the API process itself.
    """
    url: str
    expires_in_seconds: int

