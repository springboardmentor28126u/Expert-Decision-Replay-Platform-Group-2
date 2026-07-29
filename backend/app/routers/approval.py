"""
routers/approval.py
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.enums import RoleName
from app.models.user import User

from app.schemas.approval import (
    ApprovalAssign,
    ApprovalDecision,
    ApprovalOut,
)

from app.services.approval_service import ApprovalService

router = APIRouter()


def get_approval_service(
    db: AsyncSession = Depends(get_db),
) -> ApprovalService:
    return ApprovalService(db)


# --------------------------------------------------
# Queries
# --------------------------------------------------


@router.get(
    "/decision/{decision_id}",
    response_model=list[ApprovalOut],
)
async def list_approvals(
    decision_id: uuid.UUID,
    _: User = Depends(get_current_user),
    service: ApprovalService = Depends(get_approval_service),
):

    return await service.list_approvals(
        decision_id
    )


@router.get(
    "/{approval_id}",
    response_model=ApprovalOut,
)
async def get_approval(
    approval_id: uuid.UUID,
    _: User = Depends(get_current_user),
    service: ApprovalService = Depends(get_approval_service),
):

    return await service.get_approval(
        approval_id
    )


# --------------------------------------------------
# Assignment
# --------------------------------------------------


@router.post(
    "/decision/{decision_id}",
    response_model=ApprovalOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(RoleName.MANAGER, RoleName.ADMINISTRATOR))],
)
async def assign_reviewer(
    decision_id: uuid.UUID,
    payload: ApprovalAssign,
    service: ApprovalService = Depends(get_approval_service),
):

    return await service.assign_reviewer(
        decision_id,
        payload,
    )


# --------------------------------------------------
# Review
# --------------------------------------------------


@router.patch(
    "/{approval_id}",
    response_model=ApprovalOut,
)
async def review_decision(
    approval_id: uuid.UUID,
    payload: ApprovalDecision,
    current_user: User = Depends(get_current_user),
    service: ApprovalService = Depends(get_approval_service),
):

    return await service.review_decision(
        approval_id,
        payload,
        current_user,
    )


# --------------------------------------------------
# Reset
# --------------------------------------------------


@router.patch(
    "/{approval_id}/reset",
    response_model=ApprovalOut,
    dependencies=[Depends(require_role(RoleName.MANAGER, RoleName.ADMINISTRATOR))],
)
async def reset_approval(
    approval_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ApprovalService = Depends(get_approval_service),
):

    return await service.reset_approval(
        approval_id,
        current_user,
    )
