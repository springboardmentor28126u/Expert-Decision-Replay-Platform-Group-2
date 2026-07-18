"""
Expert Decision Replay Platform - User Service

Business logic for user management operations.
"""

from typing import List, Tuple, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User, UserStatus
from app.models.role import Role
from app.models.team import Team
from app.models.user_profile import UserProfile
from app.schemas.user import UserCreate, UserUpdate, UserProfileUpdate
from app.core.security import hash_password


class UserService:
    
    @staticmethod
    def get_users(
        db: Session, 
        skip: int = 0, 
        limit: int = 100, 
        role_id: Optional[UUID] = None,
        team_id: Optional[UUID] = None,
        search: Optional[str] = None
    ) -> Tuple[List[User], int]:
        """Get paginated users with optional filtering."""
        query = db.query(User)
        
        if role_id:
            query = query.filter(User.role_id == role_id)
        if team_id:
            query = query.filter(User.team_id == team_id)
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
        """Create a new user (Admin functionality)."""
        existing_user = db.query(User).filter(User.email == user_data.email.lower()).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
            
        # Get role
        role_id = user_data.role_id
        if not role_id:
            role = db.query(Role).filter(Role.name == "Employee").first()
            if not role:
                 raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Default role 'Employee' not found"
                )
            role_id = role.id
            
        new_user = User(
            full_name=user_data.full_name,
            email=user_data.email.lower(),
            password_hash=hash_password(user_data.password),
            role_id=role_id,
            team_id=user_data.team_id
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
    def assign_role(db: Session, user_id: UUID, role_id: UUID) -> User:
        """Assign a new role to a user."""
        user = UserService.get_user_by_id(db, user_id)
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
             
        user.role_id = role.id
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def assign_team(db: Session, user_id: UUID, team_id: UUID) -> User:
        """Assign a user to a team."""
        user = UserService.get_user_by_id(db, user_id)
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
             
        user.team_id = team.id
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def deactivate_user(db: Session, user_id: UUID) -> None:
        """Soft delete a user."""
        user = UserService.get_user_by_id(db, user_id)
        user.status = UserStatus.INACTIVE
        db.commit()
