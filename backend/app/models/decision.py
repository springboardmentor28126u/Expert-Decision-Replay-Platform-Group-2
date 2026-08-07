"""Decision model — maps to existing 'decisions' table."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class Decision(Base):
    """Decision model representing the decisions table.

    Statuses: Draft, Under Review, Approved, Rejected, Archived
    """

    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=True)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True)
    status = Column(String(50), default="Draft")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    creator = relationship("User", back_populates="decisions", foreign_keys=[created_by])
    alternatives = relationship("Alternative", back_populates="decision", cascade="all, delete-orphan")
    discussions = relationship("Discussion", back_populates="decision", cascade="all, delete-orphan")
    history = relationship("DecisionHistory", back_populates="decision", cascade="all, delete-orphan")
    files = relationship("FileAttachment", back_populates="decision", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Decision(id={self.id}, title='{self.title}', status='{self.status}')>"
