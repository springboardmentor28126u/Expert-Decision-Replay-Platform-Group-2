"""
models/team.py

Team — groups Users, has one Manager (a User).

Modeled with a single nullable FK (Team.manager_id -> User) rather than
a FK on User, because "no manager assigned yet" is a valid transient
team state, whereas a User always resolves cleanly through the users
side of the relationship.
"""

import uuid
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from models.user import User
    from models.decision import Decision


class Team(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "teams"

    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    manager_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # --- Relationships ---
    # Two independent FK paths exist between users <-> teams (membership
    # via User.team_id, management via Team.manager_id), so both sides
    # disambiguate with explicit foreign_keys=.
    manager: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[manager_id],
        back_populates="managed_team",
        post_update=True,  # breaks the insert-order cycle between Team and User
    )

    members: Mapped[List["User"]] = relationship(
        "User",
        foreign_keys="User.team_id",
        back_populates="team",
    )

    decisions: Mapped[List["Decision"]] = relationship(back_populates="team")

    def __repr__(self) -> str:
        return f"<Team id={self.id} name={self.name}>"
