from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(200), nullable=False)

    description = Column(Text, nullable=False)

    status = Column(String(50), default="Pending")

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationship with User
    owner = relationship(
        "User",
        back_populates="decisions"
    )

    # Relationship with Alternatives
    alternatives = relationship(
        "Alternative",
        back_populates="decision",
        cascade="all, delete-orphan"
    )

    # Relationship with Discussions
    discussions = relationship(
        "Discussion",
        back_populates="decision",
        cascade="all, delete-orphan"
    )

    # Relationship with Versions
    versions = relationship(
        "Version",
        back_populates="decision",
        cascade="all, delete-orphan"
    )

    # Relationship with Files
    files = relationship(
        "File",
        back_populates="decision",
        cascade="all, delete-orphan"
    )