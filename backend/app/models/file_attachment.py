"""FileAttachment model — NEW table for file upload metadata."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class FileAttachment(Base):
    """File attachment metadata for decisions.

    This is a new table created for Milestone 2 file upload feature.
    """

    __tablename__ = "file_attachments"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    content_type = Column(String, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    
    decision = relationship("Decision", back_populates="files")
    uploader = relationship("User", back_populates="uploaded_files")

    def __repr__(self) -> str:
        return f"<FileAttachment(id={self.id}, filename='{self.filename}')>"
