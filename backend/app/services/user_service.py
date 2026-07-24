"""
Expert Decision Replay Platform - User Service

Business logic for user management operations.
"""

from typing import List, Tuple, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User, UserStatus, UserRole
from app.models.user_profile import UserProfile
from app.schemas.user import UserCreate, UserUpdate, UserProfileUpdate
from app.core.security import hash_password


class UserService:
    
    @staticmethod
    def get_users(
        db: Session, 
        skip: int = 0, 
        limit: int = 100, 
        role: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[User], int]:
        """Get paginated users with optional search and role filter."""
        query = db.query(User)
        
        if role:
            try:
                role_enum = UserRole(role)
                query = query.filter(User.role == role_enum)
            except ValueError:
                pass
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (User.full_name.ilike(search_term)) | (User.email.ilike(search_term))
            )
            
        total = query.count()
        users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
        return users, total

    @staticmethod
    def get_user_by_id(db: Session, user_id: UUID) -> User:
        """Get a user by ID."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user
        
    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        """Create a new user."""
        existing_user = db.query(User).filter(User.email == user_data.email.lower()).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
            
        new_user = User(
            full_name=user_data.full_name,
            email=user_data.email.lower(),
            password_hash=hash_password(user_data.password),
        )
        db.add(new_user)
        db.flush()
        
        new_profile = UserProfile(user_id=new_user.id)
        db.add(new_profile)
        
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def update_user(db: Session, user_id: UUID, user_data: UserUpdate) -> User:
        """Update a user's basic info."""
        user = UserService.get_user_by_id(db, user_id)
        
        if user_data.email and user_data.email.lower() != user.email:
            existing = db.query(User).filter(User.email == user_data.email.lower()).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already taken")
            user.email = user_data.email.lower()
            
        if user_data.full_name:
            user.full_name = user_data.full_name
            
        if user_data.status:
            try:
                user.status = UserStatus(user_data.status)
            except ValueError:
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
                 
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update_profile(db: Session, user_id: UUID, profile_data: UserProfileUpdate) -> User:
        """Update extended user profile."""
        user = UserService.get_user_by_id(db, user_id)
        
        if not user.profile:
             user.profile = UserProfile(user_id=user.id)
             
        for key, value in profile_data.model_dump(exclude_unset=True).items():
            setattr(user.profile, key, value)
            
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def deactivate_user(db: Session, user_id: UUID) -> None:
        """Soft delete a user."""
        user = UserService.get_user_by_id(db, user_id)
        user.status = UserStatus.INACTIVE
        db.commit()

    @staticmethod
    def get_company_admins(db: Session, company_id: UUID) -> list["User"]:
        """Get all active admin users for a company."""
        from app.models.membership import Membership, CompanyRole
        return (
            db.query(User)
            .join(Membership, Membership.user_id == User.id)
            .filter(
                Membership.company_id == company_id,
                Membership.role == CompanyRole.ADMIN,
                User.status == UserStatus.ACTIVE,
            )
            .all()
        )

    @staticmethod
    def assign_role(db: Session, user_id: UUID, role: str) -> User:
        """Assign a global role to a user."""
        user = UserService.get_user_by_id(db, user_id)
        try:
            user.role = UserRole(role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role: {role}. Must be one of: {[r.value for r in UserRole]}",
            )
        db.commit()
        db.refresh(user)
        return user

