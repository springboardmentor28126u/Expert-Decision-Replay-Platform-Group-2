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
    GroupBrowseResponse,
    GroupJoinRequestCreate,
    GroupJoinRequestResponse,
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
        description=data.description,
    )
    return group


@router.get("", response_model=List[GroupBrowseResponse])
def list_available_groups(
    company_id: UUID = Query(..., description="Company ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List groups in the company that the current user has not actively joined."""
    return GroupService.list_available_groups(db, company_id=company_id, current_user=current_user)


@router.get("/my", response_model=List[GroupResponse])
def list_my_groups(
    company_id: UUID = Query(..., description="Company ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List groups the current user has access to in a company."""
    groups = GroupService.list_groups_for_user(db, company_id=company_id, user_id=current_user.id)
    return groups


@router.get("/{group_id}/requests", response_model=List[GroupJoinRequestResponse])
def list_group_join_requests(
    group_id: UUID,
    status: str | None = Query("pending", description="pending, accepted, rejected, or omit for all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List join requests for a group.
    Company admins can view all company group requests; group owners can view only their group.
    """
    return GroupService.list_join_requests_for_group(db, group_id, current_user, status)


@router.post("/{group_id}/join-request", response_model=GroupJoinRequestResponse, status_code=status.HTTP_201_CREATED)
def request_to_join_group(
    group_id: UUID,
    data: GroupJoinRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create an in-app request to join a group. No email is sent."""
    join_request = GroupService.request_to_join_group(
        db=db,
        group_id=group_id,
        current_user=current_user,
        message=data.message,
    )
    return GroupService._request_to_response(join_request)


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
