"""
Expert Decision Replay Platform - Users Router

Endpoints for user management (CRUD).
"""

from fastapi import APIRouter, Depends, Query, status
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
    AssignTeamRequest
)
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.user_service import UserService
from app.api.deps import get_current_user, get_current_active_admin, get_current_manager_or_admin
from app.models.user import User

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    role_id: Optional[UUID] = None,
    team_id: Optional[UUID] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin)
):
    """List all users (Admin/Manager only)."""
    users, total = UserService.get_users(db, skip, limit, role_id, team_id, search)
    # Convert ORM models to Pydantic responses manually to avoid nested async issues if any
    user_responses = [UserResponse.model_validate(u) for u in users]
    
    return {
        "items": user_responses,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "pages": (total + limit - 1) // limit
    }


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Create a new user (Admin only)."""
    return UserService.create_user(db, user_data)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific user by ID."""
    return UserService.get_user_by_id(db, user_id)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a user's basic info. Admins can update anyone, users can update themselves."""
    from fastapi import HTTPException
    if current_user.id != user_id and current_user.role.name != "Administrator":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this user")
        
    return UserService.update_user(db, user_id, user_data)


@router.put("/{user_id}/profile", response_model=UserResponse)
def update_profile(
    user_id: UUID,
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update extended user profile."""
    from fastapi import HTTPException
    if current_user.id != user_id and current_user.role.name != "Administrator":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this profile")
        
    return UserService.update_profile(db, user_id, profile_data)


@router.delete("/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Deactivate a user (Admin only)."""
    UserService.deactivate_user(db, user_id)
    return {"message": f"User {user_id} successfully deactivated"}


@router.patch("/{user_id}/role", response_model=UserResponse)
def assign_role(
    user_id: UUID,
    role_data: AssignRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Assign a role to a user (Admin only)."""
    return UserService.assign_role(db, user_id, role_data.role_id)


@router.patch("/{user_id}/team", response_model=UserResponse)
def assign_team(
    user_id: UUID,
    team_data: AssignTeamRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin)
):
    """Assign a user to a team (Admin/Manager only)."""
    return UserService.assign_team(db, user_id, team_data.team_id)
