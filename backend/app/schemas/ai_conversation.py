# schemas/ai_conversation.py
"""
schemas/ai_conversation.py
"""

import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class AIConversationCreate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)


class AIMessageCreate(BaseModel):
    """
    Deliberately just the new message text — no `role` field exists
    here at all, so there is no request shape through which a client
    could ever ask for a "system" message, or claim its own message is
    an "assistant" one. Role is always assigned server-side.
    """
    content: str = Field(min_length=1, max_length=4000)


class AIMessageOut(ORMBase):
    id: uuid.UUID
    role: Literal["user", "assistant"]
    content: str
    provider: Optional[Literal["gemini", "groq"]] = None
    created_at: datetime


class AIConversationSummaryOut(ORMBase):
    id: uuid.UUID
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AIConversationOut(AIConversationSummaryOut):
    messages: list[AIMessageOut] = []


class AIMessageExchangeOut(BaseModel):
    """
    Response to POST .../messages — the user's message is always
    present (it's persisted regardless of AI outcome); assistant_message
    is None only when both providers failed and nothing was fabricated
    to fill its place (see services/ai_conversation_service.py).
    """
    conversation_id: uuid.UUID
    user_message: AIMessageOut
    assistant_message: Optional[AIMessageOut] = None
    generated_by: Optional[Literal["gemini", "groq"]] = None
    message: Optional[str] = None
