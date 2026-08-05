"""User management router — CRUD, roles, profile."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    UserAdminUpdate,
    RoleUpdate,
    PasswordUpdate,
)
from app.services.user_service import UserService

router = APIRouter(prefix="/api/users", tags=["Users"])


# ----------------------------
# Current User Endpoints
# ----------------------------

@router.get("/me", response_model=UserResponse)
def get_current_profile(
    current_user: User = Depends(get_current_user),
):
    """Get current authenticated user."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_current_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's profile."""
    service = UserService(db)
    return service.update_user(current_user.id, data, actor_id=current_user.id)


@router.put("/me/password")
def change_password(
    data: PasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change current user's password."""
    service = UserService(db)
    service.change_password(current_user.id, data)
    return {"message": "Password changed successfully"}


# ----------------------------
# User List
# ----------------------------

@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    """List all users."""
    service = UserService(db)
    return service.get_all_users(skip=skip, limit=limit)


# ----------------------------
# Reviewer List
# ----------------------------

@router.get("/reviewers", response_model=List[UserResponse])
def get_reviewers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all reviewers."""
    service = UserService(db)
    return service.get_reviewers()


# ----------------------------
# Get User
# ----------------------------

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    """Get one user."""
    service = UserService(db)
    return service.get_user(user_id)


# ----------------------------
# Update User
# ----------------------------

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserAdminUpdate,
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    """Admin update user."""
    service = UserService(db)
    return service.admin_update_user(user_id, data, admin_id=current_user.id)


# ----------------------------
# Change Role
# ----------------------------

@router.patch("/{user_id}/role", response_model=UserResponse)
def change_user_role(
    user_id: int,
    data: RoleUpdate,
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    """Change user role."""
    service = UserService(db)
    return service.change_role(user_id, data.role, admin_id=current_user.id)


# ----------------------------
# Delete User
# ----------------------------

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    """Delete user."""
    service = UserService(db)
    service.delete_user(user_id, admin_id=current_user.id)
    return {"message": f"User {user_id} deleted successfully"}
