"""Approval workflow router."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.approval import (
    ApprovalCreate,
    ApprovalUpdate,
    ApprovalResponse,
)
from app.services.approval_service import ApprovalService

router = APIRouter(
    prefix="/api/approvals",
    tags=["Approvals"],
)


@router.post("/", response_model=ApprovalResponse)
def assign_reviewer(
    data: ApprovalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ApprovalService(db)

    return service.assign_reviewer(
        decision_id=data.decision_id,
        reviewer_id=data.reviewer_id,
        comments=data.comments,
    )


@router.get("/{decision_id}", response_model=List[ApprovalResponse])
def get_approvals(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ApprovalService(db)
    return service.get_by_decision(decision_id)


@router.patch("/{approval_id}/approve", response_model=ApprovalResponse)
def approve(
    approval_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ApprovalService(db)
    return service.approve(approval_id)


@router.patch("/{approval_id}/reject", response_model=ApprovalResponse)
def reject(
    approval_id: int,
    data: ApprovalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ApprovalService(db)
    return service.reject(
        approval_id,
        data.comments,
    )