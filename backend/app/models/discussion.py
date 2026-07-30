"""Discussion model — maps to existing 'discussions' table with new columns."""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship, backref

from app.database import Base


class Discussion(Base):
    """Discussion model for comments, meeting notes, and decision rationale.

    Existing columns: id, decision_id, user_id, comment, created_at
    New columns (added via migration): parent_id, type
    """

    __tablename__ = "discussions"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    parent_id = Column(Integer, ForeignKey("discussions.id"), nullable=True)  
    type = Column(String, default="comment", nullable=True)  
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    
    decision = relationship("Decision", back_populates="discussions")
    user = relationship("User", back_populates="discussions")
    parent = relationship("Discussion", remote_side=[id], back_populates="replies")
    replies = relationship("Discussion", back_populates="parent", uselist=True, lazy="selectin")

    def __repr__(self) -> str:
        return f"<Discussion(id={self.id}, type='{self.type}')>"
