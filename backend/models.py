from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Enum,
    Text,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


# -------------------------
# User Roles
# -------------------------
class UserRole(str, enum.Enum):
    employee = "employee"
    reviewer = "reviewer"
    manager = "manager"
    admin = "admin"


# -------------------------
# User Model
# -------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String, nullable=False)

    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    hashed_password = Column(String, nullable=False)

    role = Column(
        Enum(UserRole),
        default=UserRole.employee,
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    decisions = relationship(
        "Decision",
        back_populates="creator"
    )


# -------------------------
# Decision Status
# -------------------------
class DecisionStatus(str, enum.Enum):
    draft = "draft"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"
    archived = "archived"


# -------------------------
# Decision Model
# -------------------------
class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)

    problem_statement = Column(
        Text,
        nullable=False
    )

    category = Column(String)

    status = Column(
        Enum(DecisionStatus),
        default=DecisionStatus.draft,
        nullable=False
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    creator = relationship(
        "User",
        back_populates="decisions"
    )