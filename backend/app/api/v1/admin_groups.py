"""
Expert Decision Replay Platform - Admin Groups Router

Endpoints for admin group management (create, list, update, deactivate).
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import CompanyContext, get_company_context
from app.database.session import get_db
from app.models.membership import CompanyRole
from app.models.user import UserRole
from app.schemas.group import (
    AdminGroupCreate,
    AdminGroupDetailResponse,
    AdminGroupListItem,
    AdminGroupUpdate,
)
from app.services.group_service import GroupService

router = APIRouter()


def _require_manager_or_above(ctx: CompanyContext) -> None:
    """Allow company Admins, company Managers, and system Admins."""
    is_company_admin = ctx.role == CompanyRole.ADMIN
    is_company_manager = ctx.role == CompanyRole.MANAGER
    is_system_admin = ctx.user.role == UserRole.ADMIN
    if not (is_company_admin or is_company_manager or is_system_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")


@router.post("", response_model=AdminGroupListItem, status_code=status.HTTP_201_CREATED)
def create_admin_group(
    data: AdminGroupCreate,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context),
):
    """
    Create a new group owned by the current admin or manager.
    Company Admins and Managers can create groups via this endpoint.
    """
    _require_manager_or_above(ctx)
    return GroupService.create_admin_group(
        db=db,
        company_id=ctx.company_id,
        current_user=ctx.user,
        name=data.name,
        description=data.description,
        department=data.department,
    )


@router.get("", response_model=List[AdminGroupListItem])
def list_admin_groups(
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context),
):
    """List groups in the company. Admins see all; Managers see only their own groups."""
    _require_manager_or_above(ctx)
    return GroupService.list_admin_groups(db=db, company_id=ctx.company_id, current_user=ctx.user)


@router.get("/{group_id}", response_model=AdminGroupDetailResponse)
def get_admin_group(
    group_id: UUID,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context),
):
    """Get group detail including members and pending join requests."""
    _require_manager_or_above(ctx)
    return GroupService.get_admin_group_detail(
        db=db,
        company_id=ctx.company_id,
        group_id=group_id,
        current_user=ctx.user,
    )


@router.patch("/{group_id}", response_model=AdminGroupListItem)
def update_admin_group(
    group_id: UUID,
    data: AdminGroupUpdate,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context),
):
    _require_manager_or_above(ctx)
    return GroupService.update_admin_group(
        db=db,
        company_id=ctx.company_id,
        group_id=group_id,
        current_user=ctx.user,
        name=data.name,
        description=data.description,
        department=data.department,
    )


@router.patch("/{group_id}/deactivate", response_model=AdminGroupListItem)
def deactivate_admin_group(
    group_id: UUID,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context),
):
    _require_manager_or_above(ctx)
    return GroupService.deactivate_admin_group(
        db=db,
        company_id=ctx.company_id,
        group_id=group_id,
        current_user=ctx.user,
    )
