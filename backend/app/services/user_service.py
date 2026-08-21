"""
Expert Decision Replay Platform - User Service

Business logic for user management operations.
All queries are scoped to a specific company via membership.
"""

from typing import List, Tuple, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User, UserStatus, UserRole
from app.models.user_profile import UserProfile
from app.models.membership import Membership, CompanyRole
from app.schemas.user import UserCreate, UserUpdate, UserProfileUpdate
from app.core.security import hash_password


class UserService:
    
    @staticmethod
    def _get_company_member_ids(db: Session, company_id: UUID) -> list[UUID]:
        """Get all user IDs that are members of the given company."""
        return [
            m.user_id for m in
            db.query(Membership.user_id)
            .filter(Membership.company_id == company_id)
            .all()
        ]

    @staticmethod
    def _verify_same_company(db: Session, user_id: UUID, company_id: UUID) -> None:
        """Raise 404 if the user is not a member of the given company."""
        exists = (
            db.query(Membership)
            .filter(Membership.user_id == user_id, Membership.company_id == company_id)
            .first()
        )
        if not exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in this company",
            )

    @staticmethod
    def get_users(
        db: Session,
        company_id: UUID,
        skip: int = 0, 
        limit: int = 100, 
        role: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[User], int]:
        """Get paginated users within a company, with optional search and role filter."""
        member_ids = UserService._get_company_member_ids(db, company_id)
        if not member_ids:
            return [], 0

        query = db.query(User).filter(User.id.in_(member_ids))
        
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
    def get_user_by_id(db: Session, user_id: UUID, company_id: UUID) -> User:
        """Get a user by ID, verifying they belong to the given company."""
        UserService._verify_same_company(db, user_id, company_id)
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user
        
    @staticmethod
    def create_user(db: Session, user_data: UserCreate, company_id: UUID) -> User:
        """Create a new user and add them to the given company."""
        existing_user = db.query(User).filter(User.email == user_data.email.lower()).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        role = UserRole.EMPLOYEE
        if user_data.role:
            try:
                role = UserRole(user_data.role.lower())
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid role: {user_data.role}. Must be one of: {[r.value for r in UserRole]}",
                )

        new_user = User(
            full_name=user_data.full_name,
            email=user_data.email.lower(),
            password_hash=hash_password(user_data.password),
            role=role,
        )
        db.add(new_user)
        db.flush()

        new_profile = UserProfile(user_id=new_user.id)
        db.add(new_profile)

        # Add membership to the company
        membership = Membership(
            user_id=new_user.id,
            company_id=company_id,
            role=CompanyRole.EMPLOYEE,
        )
        db.add(membership)

        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def update_user(db: Session, user_id: UUID, user_data: UserUpdate, company_id: UUID) -> User:
        """Update a user's basic info, verifying they belong to the given company."""
        user = UserService.get_user_by_id(db, user_id, company_id)
        
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
    def update_profile(db: Session, user_id: UUID, profile_data: UserProfileUpdate, company_id: UUID) -> User:
        """Update extended user profile, verifying they belong to the given company."""
        user = UserService.get_user_by_id(db, user_id, company_id)
        
        if not user.profile:
             user.profile = UserProfile(user_id=user.id)
             
        for key, value in profile_data.model_dump(exclude_unset=True).items():
            setattr(user.profile, key, value)
            
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def deactivate_user(db: Session, user_id: UUID, company_id: UUID) -> None:
        """Soft delete a user, verifying they belong to the given company."""
        user = UserService.get_user_by_id(db, user_id, company_id)
        user.status = UserStatus.INACTIVE
        db.commit()

    @staticmethod
    def get_company_admins(db: Session, company_id: UUID) -> list["User"]:
        """Get all active admin users for a company."""
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
    def assign_role(db: Session, user_id: UUID, role: str, company_id: UUID) -> User:
        """Assign a global role to a user, verifying they belong to the given company."""
        user = UserService.get_user_by_id(db, user_id, company_id)
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
