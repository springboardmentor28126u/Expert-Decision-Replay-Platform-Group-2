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


# --- Current User Endpoints ---

@router.get("/me", response_model=UserResponse)
def get_current_profile(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_current_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current user's own profile (username, email)."""
    service = UserService(db)
    return service.update_user(current_user.id, data)


@router.put("/me/password")
def change_password(
    data: PasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change the current user's password."""
    service = UserService(db)
    service.change_password(current_user.id, data)
    return {"message": "Password changed successfully"}


# --- Admin Endpoints ---

@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    """List all users (admin only)."""
    service = UserService(db)
    return service.get_all_users(skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    """Get a specific user by ID (admin only)."""
    service = UserService(db)
    return service.get_user(user_id)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserAdminUpdate,
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    """Update any user (admin only)."""
    service = UserService(db)
    return service.admin_update_user(user_id, data)


@router.patch("/{user_id}/role", response_model=UserResponse)
def change_user_role(
    user_id: int,
    data: RoleUpdate,
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    """Change a user's role (admin only)."""
    service = UserService(db)
    return service.change_role(user_id, data.role)


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    """Delete a user (admin only)."""
    service = UserService(db)
    service.delete_user(user_id)
    return {"message": f"User {user_id} deleted successfully"}
