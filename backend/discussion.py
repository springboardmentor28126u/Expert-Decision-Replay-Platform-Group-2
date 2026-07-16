import enum
from uuid import uuid4

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import backref, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class DiscussionMessageType(str, enum.Enum):
    comment = "comment"
    reply = "reply"


class DiscussionMessage(Base):
    __tablename__ = "discussion_messages"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("discussion_messages.id"), nullable=True, index=True)
    message = Column(Text, nullable=False)
    message_type = Column(
        Enum(DiscussionMessageType),
        default=DiscussionMessageType.comment,
        nullable=False,
    )
    attachment_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    decision = relationship("Decision")
    user = relationship("User")
    replies = relationship(
        "DiscussionMessage",
        cascade="all, delete-orphan",
        backref=backref("parent", remote_side=[id]),
    )


