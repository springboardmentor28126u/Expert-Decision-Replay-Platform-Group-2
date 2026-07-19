from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    content = Column(Text, nullable=False)
    posted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    posted_at = Column(DateTime(timezone=True), server_default=func.now())