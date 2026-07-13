"""
models/user.py

User — the central identity entity. Every entity that records "who did
this" (decisions, alternatives, comments, approvals, attachments,
notifications, audit logs) has a FK back here.
"""

import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from models.role import Role
    from models.team import Team
    from models.decision import Decision
    from models.alternative import Alternative
    from models.comment import Comment
    from models.approval import Approval
    from models.attachment import Attachment
    from models.notification import Notification
    from models.audit_log import AuditLog


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    team_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # --- Relationships ---
    role: Mapped["Role"] = relationship(back_populates="users")

    team: Mapped[Optional["Team"]] = relationship(
        "Team",
        foreign_keys=[team_id],
        back_populates="members",
    )

    # Inverse of Team.manager_id — the team this user manages, if any.
    managed_team: Mapped[Optional["Team"]] = relationship(
        "Team",
        foreign_keys="Team.manager_id",
        back_populates="manager",
        uselist=False,
    )

    decisions_created: Mapped[List["Decision"]] = relationship(
        back_populates="created_by", foreign_keys="Decision.created_by_id"
    )
    alternatives_created: Mapped[List["Alternative"]] = relationship(back_populates="created_by")
    comments: Mapped[List["Comment"]] = relationship(back_populates="author")
    approvals: Mapped[List["Approval"]] = relationship(back_populates="reviewer")
    attachments_uploaded: Mapped[List["Attachment"]] = relationship(back_populates="uploaded_by")
    notifications: Mapped[List["Notification"]] = relationship(back_populates="recipient")
    audit_logs: Mapped[List["AuditLog"]] = relationship(back_populates="actor")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"
