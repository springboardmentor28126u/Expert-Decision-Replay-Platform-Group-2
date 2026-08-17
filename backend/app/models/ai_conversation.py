# models/ai_conversation.py
"""
models/ai_conversation.py

AIConversation — a persisted thread of AI-assistant messages belonging
to exactly one User. This is the server-side replacement for trusting
a client-supplied message-history array: the database, not the
request body, is the source of truth for what was actually said.

Hard-deleted (no SoftDeleteMixin) — unlike Decisions/Approvals this
isn't audit-critical record-keeping, it's a user's own private chat
log, and "delete this conversation" is expected to actually remove it
and its messages (see AIMessage's cascade below and
services/ai_conversation_service.py).
"""

import uuid
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.ai_message import AIMessage
    from app.models.user import User


class AIConversation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "ai_conversations"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Nullable: a brand-new conversation has no messages yet to derive
    # a label from. Auto-filled from the first user message once one
    # exists — see services/ai_conversation_service.py.
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # --- Relationships ---
    user: Mapped["User"] = relationship(back_populates="ai_conversations")
    # cascade="all, delete-orphan" here (unlike Decision's relationships,
    # which deliberately omit it — see models/decision.py) because a
    # deleted conversation really is supposed to take its messages with
    # it. The FK's ondelete="CASCADE" backs this up at the DB level too.
    messages: Mapped[List["AIMessage"]] = relationship(
        back_populates="conversation",
        order_by="AIMessage.created_at",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<AIConversation id={self.id} user_id={self.user_id}>"
