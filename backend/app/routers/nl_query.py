# routers/nl_query.py
"""
routers/nl_query.py
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.nl_query import NLQueryRequest, NLQueryResponse
from app.services.nl_query_service import NLQueryService

router = APIRouter()


def get_nl_query_service(
    db: AsyncSession = Depends(get_db),
) -> NLQueryService:
    return NLQueryService(db)


@router.post(
    "/",
    response_model=NLQueryResponse,
)
async def ask(
    payload: NLQueryRequest,
    _: User = Depends(get_current_user),
    service: NLQueryService = Depends(get_nl_query_service),
):
    return await service.answer(payload.question)
