"""
models/role.py

Role — lookup table, not a hardcoded enum column on User. Lets us add
finer-grained or org-specific roles later as a data change instead of a
schema migration, and gives a place to attach per-role metadata
(permission sets, max approval level) without touching User at all.
"""

from typing import List, TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from models.user import User


class Role(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(255), nullable=True)

    # --- Relationships ---
    # One role -> many users. No cascade delete: a Role must never be
    # deletable while Users still reference it (also guarded at the
    # service layer).
    users: Mapped[List["User"]] = relationship(back_populates="role")

    def __repr__(self) -> str:
        return f"<Role id={self.id} name={self.name}>"
