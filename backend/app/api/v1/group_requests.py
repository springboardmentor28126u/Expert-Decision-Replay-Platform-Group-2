"""
Expert Decision Replay Platform - Group Join Requests Router
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import CompanyContext, get_company_context, get_current_user
from app.database.session import get_db
from app.models.membership import CompanyRole
from app.models.user import User, UserRole
from app.schemas.group import GroupJoinRequestDecision, GroupJoinRequestResponse
from app.services.group_service import GroupService

router = APIRouter()


def _require_manager_or_above(ctx: CompanyContext) -> None:
    """Only Managers, company Admins, or system Admins can view incoming requests."""
    is_company_admin = ctx.role == CompanyRole.ADMIN
    is_company_manager = ctx.role == CompanyRole.MANAGER
    is_system_admin = ctx.user.role == UserRole.ADMIN
    if not (is_company_admin or is_company_manager or is_system_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")


@router.get("", response_model=List[GroupJoinRequestResponse])
def list_join_requests(
    status: str | None = Query("pending", description="pending, accepted, rejected, or omit for all"),
    group_id: UUID | None = Query(None, description="Optional group filter"),
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context),
):
    """
    List join requests visible to the caller.
    Company admins can view all requests in the company; Managers see requests for groups they own.
    """
    _require_manager_or_above(ctx)
    return GroupService.list_join_requests_for_admin(
        db=db,
        company_id=ctx.company_id,
        current_user=ctx.user,
        status_filter=status,
        group_id=group_id,
    )


@router.get("/pending-count")
def pending_join_request_count(
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context),
):
    """Return the pending join-request count visible to the caller."""
    _require_manager_or_above(ctx)
    return {
        "total": GroupService.pending_join_request_count(
            db=db,
            company_id=ctx.company_id,
            current_user=ctx.user,
        )
    }


@router.post("/{request_id}/decide", response_model=GroupJoinRequestResponse)
def decide_join_request(
    request_id: UUID,
    data: GroupJoinRequestDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept or reject a pending group join request."""
    join_request = GroupService.decide_join_request(
        db=db,
        request_id=request_id,
        current_user=current_user,
        decision=data.decision,
    )
    return GroupService._request_to_response(join_request)
