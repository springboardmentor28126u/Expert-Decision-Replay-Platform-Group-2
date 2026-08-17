# routers/ai.py
"""
routers/ai.py

Standalone AI draft-assistance endpoints that aren't scoped to an
existing decision_id — see routers/decision.py for the decision-scoped
AI endpoints (summary, similar, ask, ai-recommendation).
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.enums import RoleName
from app.models.user import User
from app.schemas.ai_conversation import (
    AIConversationCreate,
    AIConversationOut,
    AIConversationSummaryOut,
    AIMessageCreate,
    AIMessageExchangeOut,
)
from app.schemas.problem_statement import ProblemStatementRequest, ProblemStatementResponse
from app.schemas.task_routing import TaskRoutingRequest, TaskRoutingResponse
from app.services.ai_conversation_service import AIConversationService
from app.services.problem_statement_service import ProblemStatementService
from app.services.task_routing_service import TaskRoutingService

router = APIRouter()


def get_problem_statement_service() -> ProblemStatementService:
    return ProblemStatementService()


def get_task_routing_service(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> TaskRoutingService:
    return TaskRoutingService(db, background_tasks)


def get_ai_conversation_service(
    db: AsyncSession = Depends(get_db),
) -> AIConversationService:
    return AIConversationService(db)


@router.post(
    "/generate-problem-statement",
    response_model=ProblemStatementResponse,
)
async def generate_problem_statement(
    payload: ProblemStatementRequest,
    _: User = Depends(get_current_user),
    service: ProblemStatementService = Depends(get_problem_statement_service),
):
    text, generated_by = await service.generate(payload.title)
    return ProblemStatementResponse(
        title=payload.title,
        problem_statement=text,
        generated_by=generated_by,
    )


@router.post(
    "/task",
    response_model=TaskRoutingResponse,
    dependencies=[Depends(require_role(RoleName.MANAGER, RoleName.ADMINISTRATOR))],
)
async def route_task(
    payload: TaskRoutingRequest,
    current_user: User = Depends(get_current_user),
    service: TaskRoutingService = Depends(get_task_routing_service),
):
    """
    Two-phase natural-language task routing — see
    services/task_routing_service.py. confirm=False (the default) only
    interprets and validates, never mutates. confirm=True executes,
    re-validating everything against current data before touching the
    approval workflow.
    """
    return await service.route(payload, current_user)


# ---------------------------------------------------------------------
# Persistent AI conversations — see services/ai_conversation_service.py.
# Ownership-scoped only: any authenticated user may have their own
# conversations, and only their own — there is no role-based access to
# another user's conversations anywhere in this router.
# ---------------------------------------------------------------------


@router.post(
    "/conversations",
    response_model=AIConversationOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    payload: AIConversationCreate,
    current_user: User = Depends(get_current_user),
    service: AIConversationService = Depends(get_ai_conversation_service),
):
    return await service.create_conversation(current_user, payload.title)


@router.get(
    "/conversations",
    response_model=list[AIConversationSummaryOut],
)
async def list_conversations(
    current_user: User = Depends(get_current_user),
    service: AIConversationService = Depends(get_ai_conversation_service),
):
    return await service.list_conversations(current_user)


@router.get(
    "/conversations/{conversation_id}",
    response_model=AIConversationOut,
)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: AIConversationService = Depends(get_ai_conversation_service),
):
    return await service.get_conversation(conversation_id, current_user)


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: AIConversationService = Depends(get_ai_conversation_service),
):
    await service.delete_conversation(conversation_id, current_user)


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=AIMessageExchangeOut,
)
async def add_message(
    conversation_id: uuid.UUID,
    payload: AIMessageCreate,
    current_user: User = Depends(get_current_user),
    service: AIConversationService = Depends(get_ai_conversation_service),
):
    """
    Persists the user's message, loads the actual conversation history
    from the database (never trusting a client-supplied history list),
    calls the existing Gemini->Groq provider abstraction, and persists
    the assistant's reply — or, if both providers fail, persists
    nothing further and returns a fail-soft message instead of a
    fabricated reply. See services/ai_conversation_service.py.
    """
    return await service.add_message(conversation_id, current_user, payload.content)
