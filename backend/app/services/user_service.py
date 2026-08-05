"""User service — user CRUD and role management."""

import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from app.auth.password import hash_password, verify_password
from app.exceptions.handlers import (
    NotFoundException,
    ConflictException,
    BadRequestException,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserAdminUpdate,
    PasswordUpdate,
    UserResponse,
)

from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)

VALID_ROLES = {"Employee", "Reviewer", "Manager", "Administrator"}


class UserService:
    """Service handling user management business logic."""

    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.audit_service = AuditService(db)

    def get_user(self, user_id: int) -> User:
        """Get a user by ID."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(f"User with ID {user_id} not found")
        return user

    def get_all_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination."""
        return self.user_repo.get_all(skip=skip, limit=limit)

    def update_user(self, user_id: int, data: UserUpdate, actor_id: Optional[int] = None) -> User:
        """Update a user's own profile (username, email only)."""
        user = self.get_user(user_id)

        if data.email and data.email != user.email:
            if self.user_repo.email_exists(data.email, exclude_id=user_id):
                raise ConflictException("Email already in use")
            user.email = data.email

        if data.username:
            user.username = data.username

        updated_user = self.user_repo.update(user)
        self.audit_service.log_user_updated(
            admin_id=actor_id or user_id,
            target_user_id=user_id,
            username=updated_user.username,
        )
        return updated_user

    def admin_update_user(self, user_id: int, data: UserAdminUpdate, admin_id: Optional[int] = None) -> User:
        """Admin update of any user (username, email, role)."""
        user = self.get_user(user_id)

        if data.email and data.email != user.email:
            if self.user_repo.email_exists(data.email, exclude_id=user_id):
                raise ConflictException("Email already in use")
            user.email = data.email

        if data.username:
            user.username = data.username

        if data.role:
            if data.role not in VALID_ROLES:
                raise BadRequestException(
                    f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}"
                )
            user.role = data.role

        updated_user = self.user_repo.update(user)
        self.audit_service.log_user_updated(
            admin_id=admin_id or user_id,
            target_user_id=user_id,
            username=updated_user.username,
        )
        return updated_user

    def change_role(self, user_id: int, role: str, admin_id: Optional[int] = None) -> User:
        """Change a user's role."""
        if role not in VALID_ROLES:
            raise BadRequestException(
                f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}"
            )
        user = self.get_user(user_id)
        user.role = role
        logger.info(f"User {user_id} role changed to {role}")
        updated_user = self.user_repo.update(user)
        self.audit_service.log_user_role_changed(
            admin_id=admin_id or user_id,
            target_user_id=user_id,
            new_role=role,
        )
        return updated_user

    def change_password(self, user_id: int, data: PasswordUpdate) -> User:
        """Change a user's password."""
        user = self.get_user(user_id)
        if not verify_password(data.current_password, user.password):
            raise BadRequestException("Current password is incorrect")
        user.password = hash_password(data.new_password)
        return self.user_repo.update(user)

    def delete_user(self, user_id: int, admin_id: Optional[int] = None) -> None:
        """Delete a user."""
        user = self.get_user(user_id)
        self.user_repo.delete(user)
        logger.info(f"User {user_id} deleted")
        self.audit_service.log_user_deleted(
            admin_id=admin_id or user_id,
            target_user_id=user_id,
        )

    def count_users(self) -> int:
        """Get total user count."""
        return self.user_repo.count()

    def get_reviewers(self):
        return (
        self.db.query(User)
        .filter(User.role == "Reviewer")
        .all()
    )
