"""
Expert Decision Replay Platform - Groups Router

Endpoints for group management and group membership assignments.
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.group import (
    GroupCreate,
    GroupResponse,
    GroupAddMember,
    GroupMemberResponse,
)
from app.services.group_service import GroupService

router = APIRouter()


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    data: GroupCreate,
    company_id: UUID = Query(..., description="Company ID this group belongs to"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new group within a company.
    Only company Admins or Managers can create groups.
    Creator is automatically added as a group member.
    """
    group = GroupService.create_group(
        db=db,
        company_id=company_id,
        current_user=current_user,
        name=data.name,
    )
    return group


@router.get("", response_model=List[GroupResponse])
def list_groups(
    company_id: UUID = Query(..., description="Company ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all groups the current user has access to in a company."""
    groups = GroupService.list_groups_for_user(db, company_id=company_id, user_id=current_user.id)
    return groups


@router.post("/{group_id}/members", status_code=status.HTTP_201_CREATED)
def add_group_member(
    group_id: UUID,
    data: GroupAddMember,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add a user to a group.
    Only company Admins or Managers of this group can add members.
    """
    gm = GroupService.add_member_to_group(
        db=db,
        group_id=group_id,
        target_user_id=data.user_id,
        current_user=current_user,
    )
    return {
        "message": "User added to group successfully",
        "group_membership_id": gm.id,
    }
