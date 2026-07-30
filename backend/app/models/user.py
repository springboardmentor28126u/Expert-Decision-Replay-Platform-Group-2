"""User model — maps to existing 'users' table."""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    """User model representing the existing users table.

    Roles: Employee, Reviewer, Manager, Administrator
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    role = Column(String, nullable=True)

    
    decisions = relationship("Decision", back_populates="creator", foreign_keys="Decision.created_by")
    discussions = relationship("Discussion", back_populates="user")
    history_entries = relationship("DecisionHistory", back_populates="updater")
    uploaded_files = relationship("FileAttachment", back_populates="uploader")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"
