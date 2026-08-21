"""
Expert Decision Replay Platform - TeamMembership Model

Join table linking users to teams within a company.
"""

import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class TeamMemberRole(str, enum.Enum):
    """Team member roles."""
    LEADER = "leader"
    MEMBER = "member"


class TeamMembership(Base):
    """
    TeamMembership model — links a User to a Team.

    Attributes:
        id: Unique team membership identifier (UUID).
        team_id: Foreign key to teams.id.
        user_id: Foreign key to users.id.
        role: Role within the team (leader or member).
        joined_at: Timestamp when the membership became active.
        created_at: Creation timestamp.
    """
    __tablename__ = "team_memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(
        UUID(as_uuid=True),
        ForeignKey("teams.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(
        Enum(TeamMemberRole, name="team_member_role"),
        default=TeamMemberRole.MEMBER,
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    joined_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    team = relationship("Team", back_populates="team_memberships")
    user = relationship("User", back_populates="team_memberships")

    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_team_user_membership"),
    )

    def __repr__(self) -> str:
        return f"<TeamMembership(team_id={self.team_id}, user_id={self.user_id}, role={self.role})>"
