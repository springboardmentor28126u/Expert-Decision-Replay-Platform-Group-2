"""
models/decision_version.py

Immutable snapshot of a Decision.

Unlike Decision.version (which stores only the current version number),
this table stores the complete state of every previous revision so users
can inspect historical versions and auditors can reconstruct exactly
what changed over time.
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

from app.models.enums import DecisionStatus
from sqlalchemy import Enum as PgEnum

if TYPE_CHECKING:
    from app.models.decision import Decision
    from app.models.user import User


class DecisionVersion(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "decision_versions"

    decision_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    version_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    problem_statement: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    decision_rationale: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    status: Mapped[DecisionStatus] = mapped_column(
        PgEnum(
            DecisionStatus,
            name="decision_status",
            native_enum=True,
        ),
        nullable=False,
    )

    changed_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    decision: Mapped["Decision"] = relationship(
        back_populates="versions"
    )

    changed_by: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return (
            f"<DecisionVersion "
            f"decision={self.decision_id} "
            f"version={self.version_number}>"
        )
