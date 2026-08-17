# models/ai_message.py
"""
models/ai_message.py

AIMessage — one turn within an AIConversation. Deliberately holds
nothing but plain text: no file bytes (attachments belong to
models/attachment.py, never here), no credentials, no system prompt.

`role` is restricted at the database level to exactly "user" and
"assistant" — there is no "system" value, on purpose. The system
framing the LLM is given lives only as a Python constant in
services/ai_conversation_service.py; it is never persisted, and
nothing a client sends can ever be written to this table as anything
other than a "user" row (see AIMessageCreate in
schemas/ai_conversation.py, which has no `role` field at all).
"""

import uuid
from typing import Optional, TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.ai_conversation import AIConversation


class AIMessage(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "ai_messages"
    __table_args__ = (
        CheckConstraint("role IN ('user', 'assistant')", name="ck_ai_messages_role"),
    )

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # Only ever set on assistant messages — which provider produced this
    # reply, the same "gemini"/"groq"/None vocabulary already used by
    # generate_text_with_provider() and every other AI feature's
    # generated_by field.
    provider: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # --- Relationships ---
    conversation: Mapped["AIConversation"] = relationship(back_populates="messages")

    def __repr__(self) -> str:
        return f"<AIMessage id={self.id} conversation_id={self.conversation_id} role={self.role}>"
