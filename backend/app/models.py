from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


# =====================================================
# USER MODEL
# =====================================================

class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(
        String(100),
        nullable=False
    )

    employee_id = Column(
        String(20),
        unique=True,
        index=True,
        nullable=False
    )

    email = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    password = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(50),
        nullable=False
    )

    department = Column(
        String(100),
        nullable=True
    )

    security_question = Column(
        String(255),
        nullable=False
    )

    security_answer = Column(
        String(255),
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationships

    decisions = relationship(
        "Decision",
        back_populates="owner"
    )

    discussions = relationship(
        "Discussion",
        back_populates="user"
    )

    approvals = relationship(
        "Approval",
        back_populates="approver"
    )

    knowledge_articles = relationship(
        "KnowledgeRepository",
        back_populates="creator"
    )
    audit_logs = relationship(
    "AuditLog",
    back_populates="user"
)
    # =====================================================
# DECISION MODEL
# =====================================================

class Decision(Base):
    from sqlalchemy.ext.hybrid import hybrid_property
    @hybrid_property
    def owner_name(self):
        return self.owner.full_name if self.owner else ""

    __tablename__ = "decisions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    problem_statement = Column(
        Text,
        nullable=False
    )

    category = Column(
        String(100),
        nullable=False
    )

    department = Column(
        String(100),
        nullable=False
    )

    priority = Column(
        String(30),
        default="Medium"
    )

    status = Column(
        String(50),
        default="Draft"
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # ===========================
    # Relationships
    # ===========================

    owner = relationship(
        "User",
        back_populates="decisions"
    )

    discussions = relationship(
        "Discussion",
        back_populates="decision",
        cascade="all, delete"
    )

    approvals = relationship(
        "Approval",
        back_populates="decision",
        cascade="all, delete"
    )

    alternatives = relationship(
        "AlternativeAnalysis",
        back_populates="decision",
        cascade="all, delete"
    )
    # =====================================================
# APPROVAL MODEL
# =====================================================

class Approval(Base):

    __tablename__ = "approvals"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id"),
        nullable=False
    )

    approver_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    status = Column(
        String(50),
        default="Pending"
    )

    comments = Column(
        Text,
        nullable=True
    )

    approved_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # =====================================================
    # ESCALATION
    # =====================================================

    due_date = Column(
        DateTime(timezone=True),
        nullable=True
    )

    escalated = Column(
        Boolean,
        default=False,
        nullable=False
    )

    escalated_at = Column(
        DateTime(timezone=True),
        nullable=True
    )   
     # Relationships

    decision = relationship(
        "Decision",
        back_populates="approvals"
    )

    approver = relationship(
        "User",
        back_populates="approvals"
    )
# =====================================================
# DISCUSSION MODEL
# =====================================================

class Discussion(Base):

    __tablename__ = "discussions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    comment = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationships

    decision = relationship(
        "Decision",
        back_populates="discussions"
    )

    user = relationship(
        "User",
        back_populates="discussions"
    )
    # =====================================================
# KNOWLEDGE REPOSITORY MODEL
# =====================================================

class KnowledgeRepository(Base):

    __tablename__ = "knowledge_repository"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(255),
        nullable=False
    )

    content = Column(
        Text,
        nullable=False
    )

    category = Column(
        String(100),
        nullable=False
    )

    tags = Column(
        String(255),
        nullable=True
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationships

    creator = relationship(
        "User",
        back_populates="knowledge_articles"
    )
    # =====================================================
# ALTERNATIVE ANALYSIS MODEL
# =====================================================

class AlternativeAnalysis(Base):

    __tablename__ = "alternative_analysis"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id"),
        nullable=False
    )

    alternative_name = Column(
        String(200),
        nullable=False
    )

    description = Column(
        Text,
        nullable=False
    )

    advantages = Column(
        Text,
        nullable=True
    )

    disadvantages = Column(
        Text,
        nullable=True
    )

    estimated_cost = Column(
        String(100),
        nullable=True
    )

    risk_level = Column(
        String(30),
        default="Medium"
    )

    score = Column(
        Integer,
        default=0
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationship with Decision
    decision = relationship(
        "Decision",
        back_populates="alternatives"
    )
    # =====================================================
# AUDIT LOG MODEL
# =====================================================

class AuditLog(Base):

    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    username = Column(
        String(100),
        nullable=False
    )

    role = Column(
        String(50),
        nullable=False
    )

    module = Column(
        String(100),
        nullable=False
    )

    action = Column(
        String(100),
        nullable=False
    )

    entity_id = Column(
        Integer,
        nullable=True
    )

    description = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationship
    user = relationship(
    "User",
    back_populates="audit_logs"
)
# =====================================================
# VERSION TRACKING MODEL
# =====================================================

class VersionTracking(Base):

    __tablename__ = "version_tracking"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id"),
        nullable=False
    )

    version_number = Column(
        Integer,
        default=1
    )

    changed_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    change_summary = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationships
    decision = relationship("Decision")
    user = relationship("User")
# =====================================================
# NOTIFICATION MODEL
# =====================================================

class Notification(Base):

    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    title = Column(
        String(200),
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    is_read = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    user = relationship("User")
# =====================================================
# ATTACHMENT MODEL
# =====================================================

class Attachment(Base):

    __tablename__ = "attachments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id"),
        nullable=False
    )

    uploaded_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    file_name = Column(
        String(255),
        nullable=False
    )

    file_path = Column(
        String(500),
        nullable=False
    )

    file_type = Column(
        String(100),
        nullable=True
    )

    file_size = Column(
        Integer,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    decision = relationship("Decision")

    user = relationship("User")