"""
routers/decision.py
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.decision import (
    DecisionCreate,
    DecisionOut,
    DecisionStatusUpdate,
    DecisionUpdate,
)
from app.schemas.decision_version import DecisionVersionOut
from app.services.decision_service import DecisionService

router = APIRouter()


def get_decision_service(
    db: AsyncSession = Depends(get_db),
) -> DecisionService:
    return DecisionService(db)


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
