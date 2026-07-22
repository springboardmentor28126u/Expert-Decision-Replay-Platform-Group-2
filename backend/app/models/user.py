import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base

class Team(Base):
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(String(1000), nullable=True)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id", name="fk_team_manager", use_alter=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    # Use string references for foreign keys to avoid circular imports during evaluation
    manager = relationship("User", foreign_keys=[manager_id], post_update=True)
    members = relationship("User", foreign_keys="[User.team_id]", back_populates="team")

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    
    # Roles: employee, reviewer, manager, administrator
    role = Column(String(50), nullable=False, default="employee")
    
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", name="fk_user_team"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    team = relationship("Team", foreign_keys=[team_id], back_populates="members")
