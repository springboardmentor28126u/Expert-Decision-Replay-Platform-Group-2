"""User repository — data access for users table."""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for user data operations."""

    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        """Find a user by email address."""
        return self.db.query(User).filter(User.email == email).first()

    def get_by_username(self, username: str) -> Optional[User]:
        """Find a user by username."""
        return self.db.query(User).filter(User.username == username).first()

    def email_exists(self, email: str, exclude_id: Optional[int] = None) -> bool:
        """Check if an email is already registered.

        Args:
            email: Email to check.
            exclude_id: Optional user ID to exclude (for updates).
        """
        query = self.db.query(User).filter(User.email == email)
        if exclude_id:
            query = query.filter(User.id != exclude_id)
        return query.first() is not None
