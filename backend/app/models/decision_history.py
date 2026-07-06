from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.database import Base


class DecisionHistory(Base):
    __tablename__ = "decision_history"

    id = Column(Integer, primary_key=True, index=True)

    decision_id = Column(Integer, ForeignKey("decisions.id"))

    title = Column(String(255))
    description = Column(Text)
    category = Column(String(100))
    status = Column(String(50))

    updated_by = Column(Integer, ForeignKey("users.id"))

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )