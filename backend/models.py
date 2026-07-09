from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    employee = "employee"
    reviewer = "reviewer"
    manager = "manager"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.employee, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

from sqlalchemy import Text, ForeignKey
from sqlalchemy.orm import relationship

class DecisionStatus(str, enum.Enum):
    draft = "draft"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"
    archived = "archived"

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    problem_statement = Column(Text, nullable=False)
    category = Column(String, nullable=True)
    status = Column(Enum(DecisionStatus), default=DecisionStatus.draft, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User")