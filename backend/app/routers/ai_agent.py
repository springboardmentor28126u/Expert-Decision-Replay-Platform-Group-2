from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import require_employee
from app.ai.service import chat_with_agent


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/ai-agent",
    tags=["AI Decision Intelligence"]
)


# =====================================================
# CONVERSATION MESSAGE
# =====================================================

class ConversationMessage(BaseModel):

    role: str

    content: str


# =====================================================
# REQUEST SCHEMA
# =====================================================

class AIChatRequest(BaseModel):

    message: str

    conversation_history: Optional[
        List[ConversationMessage]
    ] = []


# =====================================================
# RESPONSE SCHEMA
# =====================================================

class AIChatResponse(BaseModel):

    answer: str

    data: dict


# =====================================================
# AI CHAT
# =====================================================

@router.post(
    "/chat",
    response_model=AIChatResponse
)
def ai_chat(

    request: AIChatRequest,

    db: Session = Depends(get_db),

    current_user=Depends(require_employee)

):

    return chat_with_agent(

        db,

        request.message,

        request.conversation_history

    )