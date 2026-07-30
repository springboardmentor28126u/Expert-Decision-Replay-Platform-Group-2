from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class File(Base):
    __tablename__ = "files"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Decision Relationship
    decision_id = Column(
        Integer,
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False
    )

    # File Information
    filename = Column(String(255), nullable=False)

    filepath = Column(String(500), nullable=False)

    # Upload Time
    uploaded_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationship
    decision = relationship("Decision", back_populates="files")