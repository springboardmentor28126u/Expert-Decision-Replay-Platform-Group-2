from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class Alternative(Base):
    __tablename__ = "alternatives"

    id = Column(Integer, primary_key=True, index=True)

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id"),
        nullable=False
    )

    option_name = Column(String(255), nullable=False)

    pros = Column(Text)

    cons = Column(Text)

    estimated_cost = Column(String(100))

    feasibility = Column(String(50))

    risk_level = Column(String(50))

    decision = relationship("Decision")