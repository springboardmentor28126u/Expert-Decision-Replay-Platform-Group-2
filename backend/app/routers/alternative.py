"""
routers/alternative.py
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.alternative import (
    AlternativeCreate,
    AlternativeOut,
    AlternativeUpdate,
)
from app.services.alternative_service import AlternativeService

router = APIRouter()


def get_alternative_service(
    db: AsyncSession = Depends(get_db),
) -> AlternativeService:
    return AlternativeService(db)


@router.get(
    "/decision/{decision_id}",
    response_model=list[AlternativeOut],
)
async def list_alternatives(
    decision_id: uuid.UUID,
    service: AlternativeService = Depends(get_alternative_service),
):
    return await service.list_alternatives(decision_id)


@router.get(
    "/{alternative_id}",
    response_model=AlternativeOut,
)
async def get_alternative(
    alternative_id: uuid.UUID,
    service: AlternativeService = Depends(get_alternative_service),
):
    return await service.get_alternative(alternative_id)


@router.post(
    "/decision/{decision_id}",
    response_model=AlternativeOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_alternative(
    decision_id: uuid.UUID,
    payload: AlternativeCreate,
    current_user: User = Depends(get_current_user),
    service: AlternativeService = Depends(get_alternative_service),
):
    return await service.create_alternative(
        decision_id,
        payload,
        current_user,
    )


@router.put(
    "/{alternative_id}",
    response_model=AlternativeOut,
)
async def update_alternative(
    alternative_id: uuid.UUID,
    payload: AlternativeUpdate,
    current_user: User = Depends(get_current_user),
    service: AlternativeService = Depends(get_alternative_service),
):
    return await service.update_alternative(
        alternative_id,
        payload,
        current_user,
    )


@router.patch(
    "/{alternative_id}/select",
    response_model=AlternativeOut,
)
async def select_alternative(
    alternative_id: uuid.UUID,
    service: AlternativeService = Depends(get_alternative_service),
):
    return await service.select_alternative(
        alternative_id,
    )


@router.delete(
    "/{alternative_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_alternative(
    alternative_id: uuid.UUID,
    service: AlternativeService = Depends(get_alternative_service),
):
    await service.delete_alternative(
        alternative_id,
    )
