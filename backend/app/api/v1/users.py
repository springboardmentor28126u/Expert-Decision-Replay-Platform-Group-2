"""
Expert Decision Replay Platform - Users Router

Endpoints for user management (CRUD).
All user operations are scoped to the requesting user's company.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.database.session import get_db
from app.schemas.user import (
    UserResponse, 
    UserCreate, 
    UserUpdate, 
    UserProfileUpdate,
    AssignRoleRequest,
    AssignTeamRequest,
)
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.user_service import UserService
from app.services.team_service import TeamService
from app.schemas.team import TeamMemberAdd
from app.api.deps import (
    get_current_user,
    get_company_context,
    require_company_role,
    CompanyContext,
)
from app.models.user import User
from app.models.membership import CompanyRole

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    role: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.MANAGER, CompanyRole.ADMIN)),
):
    """List users in the current company (Manager/Admin only, company-scoped)."""
    users, total = UserService.get_users(db, ctx.company_id, skip, limit, role, search)
    user_responses = [UserResponse.model_validate(u) for u in users]
    
    return {
        "items": user_responses,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/admins", response_model=list[UserResponse])
def list_company_admins(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    ctx: CompanyContext = Depends(get_company_context),
):
    """List active admins for the current user's company."""
    return UserService.get_company_admins(db, ctx.company_id)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate, 
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """Create a new user and add them to the current company (Admin only)."""
    return UserService.create_user(db, user_data, ctx.company_id)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    ctx: CompanyContext = Depends(get_company_context),
):
    """Get a specific user by ID (must be in the same company)."""
    return UserService.get_user_by_id(db, user_id, ctx.company_id)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    ctx: CompanyContext = Depends(get_company_context),
):
    """Update a user's basic info. Users can update themselves; company admins can update anyone in their company."""
    if current_user.id != user_id and ctx.role != CompanyRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user",
        )
    return UserService.update_user(db, user_id, user_data, ctx.company_id)


@router.put("/{user_id}/profile", response_model=UserResponse)
def update_profile(
    user_id: UUID,
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    ctx: CompanyContext = Depends(get_company_context),
):
    """Update extended user profile. Users can update themselves; company admins can update anyone in their company."""
    if current_user.id != user_id and ctx.role != CompanyRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this profile",
        )
    return UserService.update_profile(db, user_id, profile_data, ctx.company_id)


@router.delete("/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """Deactivate a user (company Admin only, must be in same company)."""
    UserService.deactivate_user(db, user_id, ctx.company_id)
    return {"message": f"User {user_id} successfully deactivated"}


@router.patch("/{user_id}/role", response_model=UserResponse)
def assign_role(
    user_id: UUID,
    role_data: AssignRoleRequest,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """Assign a role to a user (company Admin only, must be in same company)."""
    return UserService.assign_role(db, user_id, role_data.role, ctx.company_id)


@router.patch("/{user_id}/team", response_model=MessageResponse)
def assign_team(
    user_id: UUID,
    data: AssignTeamRequest,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """Assign a user to a team (company Admin only, must be in same company)."""
    # Verify user exists in company
    UserService.get_user_by_id(db, user_id, ctx.company_id)

    # Add user to team (or update if already in a different team)
    TeamService.add_member_to_team(
        db, data.team_id, TeamMemberAdd(user_id=user_id, role="member"), ctx.company_id
    )
    return {"message": f"User {user_id} assigned to team {data.team_id}"}
