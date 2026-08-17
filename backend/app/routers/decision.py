"""
routers/decision.py
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.enums import RoleName
from app.models.user import User
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.decision import (
    DecisionCreate,
    DecisionOut,
    DecisionStatusUpdate,
    DecisionUpdate,
)
from app.schemas.decision_version import DecisionVersionOut
from app.schemas.decision_summary import DecisionSummaryOut
from app.schemas.decision_insight import (
    AskDecisionRequest,
    AskDecisionResponse,
    SimilarDecisionOut,
)
from app.schemas.approval_intelligence import ApprovalRecommendationOut
from app.services.decision_service import DecisionService
from app.services.decision_summary_service import DecisionSummaryService
from app.services.decision_insight_service import DecisionInsightService
from app.services.approval_intelligence_service import ApprovalIntelligenceService

router = APIRouter()


def get_decision_service(
    db: AsyncSession = Depends(get_db),
) -> DecisionService:
    return DecisionService(db)


def get_decision_summary_service(
    db: AsyncSession = Depends(get_db),
) -> DecisionSummaryService:
    return DecisionSummaryService(db)


def get_decision_insight_service(
    db: AsyncSession = Depends(get_db),
) -> DecisionInsightService:
    return DecisionInsightService(db)


def get_approval_intelligence_service(
    db: AsyncSession = Depends(get_db),
) -> ApprovalIntelligenceService:
    return ApprovalIntelligenceService(db)


@router.get(
    "/",
    response_model=PaginatedResponse[DecisionOut],
)
async def list_decisions(
    pagination: PaginationParams = Depends(),
    _: User = Depends(get_current_user),
    service: DecisionService = Depends(get_decision_service),
):
    return await service.list_decisions(pagination)


@router.get(
    "/search",
    response_model=PaginatedResponse[DecisionOut],
)
async def search_decisions(
    keyword: str = Query(...),
    pagination: PaginationParams = Depends(),
    _: User = Depends(get_current_user),
    service: DecisionService = Depends(get_decision_service),
):
    return await service.search(keyword, pagination)


@router.get(
    "/{decision_id}",
    response_model=DecisionOut,
)
async def get_decision(
    decision_id: uuid.UUID,
    _: User = Depends(get_current_user),
    service: DecisionService = Depends(get_decision_service),
):
    return await service.get_decision(decision_id)


@router.post(
    "/",
    response_model=DecisionOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_decision(
    payload: DecisionCreate,
    current_user: User = Depends(get_current_user),
    service: DecisionService = Depends(get_decision_service),
):
    return await service.create_decision(payload, current_user)


@router.put(
    "/{decision_id}",
    response_model=DecisionOut,
)
async def update_decision(
    decision_id: uuid.UUID,
    payload: DecisionUpdate,
    current_user: User = Depends(get_current_user),
    service: DecisionService = Depends(get_decision_service),
):
    return await service.update_decision(
        decision_id,
        payload,
        current_user,
    )


@router.patch(
    "/{decision_id}/status",
    response_model=DecisionOut,
    dependencies=[Depends(require_role(RoleName.MANAGER, RoleName.ADMINISTRATOR))],
)
async def update_status(
    decision_id: uuid.UUID,
    payload: DecisionStatusUpdate,
    current_user: User = Depends(get_current_user),
    service: DecisionService = Depends(get_decision_service),
):
    return await service.update_status(
        decision_id,
        payload,
        current_user,
    )


@router.get(
    "/{decision_id}/versions",
    response_model=list[DecisionVersionOut],
)
async def get_versions(
    decision_id: uuid.UUID,
    _: User = Depends(get_current_user),
    service: DecisionService = Depends(get_decision_service),
):
    return await service.get_versions(decision_id)


@router.get(
    "/{decision_id}/summary",
    response_model=DecisionSummaryOut,
)
async def get_decision_summary(
    decision_id: uuid.UUID,
    _: User = Depends(get_current_user),
    service: DecisionSummaryService = Depends(get_decision_summary_service),
):
    return await service.get_summary(decision_id)


@router.get(
    "/{decision_id}/similar",
    response_model=list[SimilarDecisionOut],
)
async def get_similar_decisions(
    decision_id: uuid.UUID,
    _: User = Depends(get_current_user),
    service: DecisionInsightService = Depends(get_decision_insight_service),
):
    return await service.find_similar(decision_id)


@router.post(
    "/{decision_id}/ask",
    response_model=AskDecisionResponse,
)
async def ask_about_decision(
    decision_id: uuid.UUID,
    payload: AskDecisionRequest,
    _: User = Depends(get_current_user),
    service: DecisionInsightService = Depends(get_decision_insight_service),
):
    answer, generated_by = await service.answer_question(
        decision_id,
        payload.question,
    )
    return AskDecisionResponse(
        decision_id=decision_id,
        question=payload.question,
        answer=answer,
        generated_by=generated_by,
    )


@router.get(
    "/{decision_id}/ai-recommendation",
    response_model=ApprovalRecommendationOut,
    dependencies=[Depends(require_role(RoleName.REVIEWER, RoleName.MANAGER, RoleName.ADMINISTRATOR))],
)
async def get_ai_recommendation(
    decision_id: uuid.UUID,
    service: ApprovalIntelligenceService = Depends(get_approval_intelligence_service),
):
    """
    Read-only AI recommendation for a human reviewer/manager/admin to
    consider — never approves, rejects, reassigns, or otherwise mutates
    the decision or its approval records. See
    services/approval_intelligence_service.py.
    """
    return await service.get_recommendation(decision_id)


@router.delete(
    "/{decision_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_decision(
    decision_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: DecisionService = Depends(get_decision_service),
):
    await service.delete_decision(decision_id, current_user)
