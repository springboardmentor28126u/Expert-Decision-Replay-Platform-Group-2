from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Alternative(Base):
    __tablename__ = "alternatives"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign Key to Decision
    decision_id = Column(
        Integer,
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False
    )

    # Alternative Details
    title = Column(String(200), nullable=False)

    description = Column(Text, nullable=False)

    pros = Column(Text, nullable=True)

    cons = Column(Text, nullable=True)

    score = Column(Float, default=0.0)

    # Created Date
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationship with Decision
    decision = relationship(
        "Decision",
        back_populates="alternatives"
    )