"""
Expert Decision Replay Platform - Company Service

Business logic for multi-tenant company management and invitation.
"""

from typing import List, Tuple, Optional
from uuid import UUID
import re
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.group import Group
from app.models.membership import Membership, CompanyRole
from app.models.group_membership import GroupMembership
from app.models.user import User
from app.core.security import hash_password


class CompanyService:
    @staticmethod
    def _generate_slug(name: str) -> str:
        """Generate a URL-friendly slug from company name."""
        slug = re.sub(r"[^\w\s-]", "", name.lower()).strip()
        slug = re.sub(r"[-\s]+", "-", slug)
        return slug

    @staticmethod
    def create_company(
        db: Session,
        name: str,
        creator_id: UUID,
        slug: Optional[str] = None,
    ) -> Tuple[Company, Membership]:
        """
        Create a new Company and assign the creator role=admin.
        Also creates a default Group ('Default Group') and adds creator to it.
        """
        if not slug:
            slug = CompanyService._generate_slug(name)

        # Check slug uniqueness
        existing = db.query(Company).filter(Company.slug == slug).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Company with slug '{slug}' already exists",
            )

        company = Company(name=name, slug=slug)
        db.add(company)
        db.flush()

        # Add creator as Admin
        membership = Membership(
            user_id=creator_id,
            company_id=company.id,
            role=CompanyRole.ADMIN,
        )
        db.add(membership)

        # Create default Group
        default_group = Group(
            company_id=company.id,
            name="Default Group",
        )
        db.add(default_group)
        db.flush()

        # Add creator to default group
        group_member = GroupMembership(
            group_id=default_group.id,
            user_id=creator_id,
        )
        db.add(group_member)

        db.commit()
        db.refresh(company)
        db.refresh(membership)
        return company, membership

    @staticmethod
    def list_user_companies(db: Session, user_id: UUID) -> List[Tuple[Company, CompanyRole]]:
        """List all companies a user is a member of, with their role in each."""
        memberships = (
            db.query(Membership)
            .filter(Membership.user_id == user_id)
            .all()
        )
        result = []
        for m in memberships:
            result.append((m.company, m.role))
        return result

    @staticmethod
    def invite_user(
        db: Session,
        company_id: UUID,
        inviter_user: User,
        email: str,
        role: CompanyRole = CompanyRole.EMPLOYEE,
    ) -> Membership:
        """
        Invite a user by email to join a company with a role.
        Only company Admins can invite.
        """
        # Verify inviter is Admin
        inviter_mem = (
            db.query(Membership)
            .filter(Membership.user_id == inviter_user.id, Membership.company_id == company_id)
            .first()
        )
        if not inviter_mem or inviter_mem.role != CompanyRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only company Admins can invite members",
            )

        # Check if target user exists
        target_user = db.query(User).filter(User.email == email).first()
        if not target_user:
            # Create account for target user with temporary password
            target_user = User(
                full_name=email.split("@")[0].capitalize(),
                email=email,
                password_hash=hash_password("TemporaryPassword123!"),
            )
            db.add(target_user)
            db.flush()

        # Check if already a member
        existing_mem = (
            db.query(Membership)
            .filter(Membership.user_id == target_user.id, Membership.company_id == company_id)
            .first()
        )
        if existing_mem:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User '{email}' is already a member of this company",
            )

        membership = Membership(
            user_id=target_user.id,
            company_id=company_id,
            role=role,
        )
        db.add(membership)

        # Add to default group of company
        default_group = (
            db.query(Group)
            .filter(Group.company_id == company_id)
            .order_by(Group.created_at.asc())
            .first()
        )
        if default_group:
            gm = GroupMembership(group_id=default_group.id, user_id=target_user.id)
            db.add(gm)

        db.commit()
        db.refresh(membership)
        return membership
