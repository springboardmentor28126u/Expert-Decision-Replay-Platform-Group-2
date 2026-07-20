"""Replay model — maps to existing 'replays' table. Read-only, not modified."""

from sqlalchemy import Column, Integer, String, ForeignKey

from app.database import Base


class Replay(Base):
    """Replay model — existing table, left untouched for M1/M2."""

    __tablename__ = "replays"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=True)
    notes = Column(String, nullable=True)

    def __repr__(self) -> str:
        return f"<Replay(id={self.id}, decision_id={self.decision_id})>"
