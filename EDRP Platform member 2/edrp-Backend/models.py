from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, Table, Boolean, UniqueConstraint, Float
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="Employee")
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="draft")  # draft, in_review, finalized
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    owner = relationship("User", backref="decisions")
    category = relationship("Category", back_populates="decisions")
    tags = relationship(
        "Tag",
        secondary="decision_tags",
        backref="decisions",
        lazy="dynamic",
    )
    alternatives = relationship(
        "Alternative",
        back_populates="decision",
        cascade="all, delete-orphan",
    )
    knowledge_items = relationship(
        "Knowledge",
        back_populates="decision",
        cascade="all, delete-orphan",
    )
    attachments = relationship("Attachment", back_populates="decision", lazy="dynamic")
    versions = relationship("DecisionVersion", back_populates="decision", lazy="dynamic")


class Alternative(Base):
    __tablename__ = "alternatives"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    title = Column(String, nullable=True)
    description = Column(String, nullable=False)
    pros = Column(String, nullable=True)
    cons = Column(String, nullable=True)
    score = Column(Integer, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    feasibility_score = Column(Integer, nullable=True)
    risk_score = Column(Integer, nullable=True)
    is_selected = Column(Boolean, default=False, server_default="false", nullable=False)

    decision = relationship("Decision", back_populates="alternatives")


class Knowledge(Base):
    __tablename__ = "knowledge"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    content = Column(String, nullable=False)
    source = Column(String, nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    decision = relationship("Decision", back_populates="knowledge_items")

# Association table for Decision ↔ Tag (many‑to‑many)
decision_tags = Table(
    "decision_tags",
    Base.metadata,
    Column("decision_id", Integer, ForeignKey("decisions.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    decisions = relationship("Decision", back_populates="category", lazy="dynamic")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    decision = relationship("Decision", back_populates="attachments")


class DecisionVersion(Base):
    __tablename__ = "decision_versions"
    __table_args__ = (UniqueConstraint("decision_id", "version_number"),)

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    decision = relationship("Decision", back_populates="versions")
    updater = relationship("User")


class Discussion(Base):
    __tablename__ = "discussions"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    discussion_id = Column(Integer, ForeignKey("discussions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MeetingNote(Base):
    __tablename__ = "meeting_notes"

    id = Column(Integer, primary_key=True, index=True)
    discussion_id = Column(Integer, ForeignKey("discussions.id"), nullable=False)
    note = Column(String, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DecisionRationale(Base):
    __tablename__ = "decision_rationales"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    rationale = Column(String, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DiscussionAttachment(Base):
    __tablename__ = "discussion_attachments"

    id = Column(Integer, primary_key=True, index=True)
    discussion_id = Column(Integer, ForeignKey("discussions.id"), nullable=False)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())