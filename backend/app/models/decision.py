import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Float, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    problem_statement = Column(Text, nullable=False)
    evaluation_criteria = Column(Text, nullable=False)
    
    # Statuses: draft, under_review, approved, rejected, archived
    status = Column(String(50), nullable=False, default="draft")
    
    category_id = Column(Integer, ForeignKey("categories.id", name="fk_decision_category"), nullable=False)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id", name="fk_decision_creator"), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", name="fk_decision_team"), nullable=True)
    version = Column(Integer, nullable=False, default=1)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    category = relationship("Category", foreign_keys=[category_id])
    creator = relationship("User", foreign_keys=[creator_id])
    team = relationship("Team", foreign_keys=[team_id])
    
    alternatives = relationship("Alternative", back_populates="decision", cascade="all, delete-orphan")
    discussions = relationship("Discussion", back_populates="decision", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="decision", cascade="all, delete-orphan")
    versions = relationship("DecisionVersion", back_populates="decision", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="decision", cascade="all, delete-orphan")

class Alternative(Base):
    __tablename__ = "alternatives"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    decision_id = Column(UUID(as_uuid=True), ForeignKey("decisions.id", name="fk_alternative_decision", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    pros = Column(Text, nullable=True)
    cons = Column(Text, nullable=True)
    cost_estimate = Column(Float, nullable=False, default=0.0)
    feasibility_analysis = Column(Text, nullable=True)
    risk_assessment = Column(Text, nullable=True)
    is_chosen = Column(Boolean, nullable=False, default=False)

    # Relationships
    decision = relationship("Decision", back_populates="alternatives")

class Discussion(Base):
    __tablename__ = "discussions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    decision_id = Column(UUID(as_uuid=True), ForeignKey("decisions.id", name="fk_discussion_decision", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", name="fk_discussion_user"), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("discussions.id", name="fk_discussion_parent", ondelete="CASCADE"), nullable=True)
    
    content = Column(Text, nullable=False)
    meeting_notes = Column(Text, nullable=True)
    decision_rationale = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    decision = relationship("Decision", back_populates="discussions")
    user = relationship("User")
    parent = relationship("Discussion", remote_side=[id], back_populates="replies")
    replies = relationship("Discussion", cascade="all, delete-orphan", back_populates="parent")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    decision_id = Column(UUID(as_uuid=True), ForeignKey("decisions.id", name="fk_attachment_decision", ondelete="CASCADE"), nullable=True)
    discussion_id = Column(UUID(as_uuid=True), ForeignKey("discussions.id", name="fk_attachment_discussion", ondelete="CASCADE"), nullable=True)
    
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(100), nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", name="fk_attachment_uploader"), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    decision = relationship("Decision", back_populates="attachments")
    uploader = relationship("User")

class DecisionVersion(Base):
    __tablename__ = "decision_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    decision_id = Column(UUID(as_uuid=True), ForeignKey("decisions.id", name="fk_version_decision", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    problem_statement = Column(Text, nullable=False)
    evaluation_criteria = Column(Text, nullable=False)
    status = Column(String(50), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", name="fk_version_category"), nullable=False)
    version = Column(Integer, nullable=False)
    
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", name="fk_version_updater"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    decision = relationship("Decision", back_populates="versions")
    editor = relationship("User")

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    decision_id = Column(UUID(as_uuid=True), ForeignKey("decisions.id", name="fk_approval_decision", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", name="fk_approval_reviewer", ondelete="CASCADE"), nullable=False)
    stage = Column(Integer, nullable=False, default=1)
    status = Column(String(50), nullable=False, default="pending")  # pending, approved, rejected
    comments = Column(Text, nullable=True)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    actioned_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    decision = relationship("Decision", back_populates="approvals")
    reviewer = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", name="fk_notification_user", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", name="fk_audit_user", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_name = Column(String(50), nullable=True)
    entity_id = Column(String(255), nullable=True)
    old_values = Column(Text, nullable=True)  # Store serialized JSON string
    new_values = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")
