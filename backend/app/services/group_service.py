"""
Expert Decision Replay Platform - Group Service

Business logic for group creation and membership management within a company.
"""

from typing import List
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.group import Group
from app.models.group_membership import GroupMembership
from app.models.membership import Membership, CompanyRole
from app.models.user import User


class GroupService:
    @staticmethod
    def create_group(
        db: Session,
        company_id: UUID,
        current_user: User,
        name: str,
    ) -> Group:
        """
        Create a new group in a company.
        Allowed for Admins and Managers of that company.
        Creator is automatically added as a GroupMembership member.
        """
        mem = (
            db.query(Membership)
            .filter(Membership.user_id == current_user.id, Membership.company_id == company_id)
            .first()
        )
        if not mem or mem.role not in (CompanyRole.ADMIN, CompanyRole.MANAGER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Admins or Managers can create groups",
            )

        group = Group(company_id=company_id, name=name)
        db.add(group)
        db.flush()

        gm = GroupMembership(group_id=group.id, user_id=current_user.id)
        db.add(gm)

        db.commit()
        db.refresh(group)
        return group

    @staticmethod
    def add_member_to_group(
        db: Session,
        group_id: UUID,
        target_user_id: UUID,
        current_user: User,
    ) -> GroupMembership:
        """
        Add a user to a group.
        Allowed for company Admins or Managers who belong to that group.
        Target user MUST have a Membership in the company.
        """
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found",
            )

        # Check permission of current_user
        mem = (
            db.query(Membership)
            .filter(Membership.user_id == current_user.id, Membership.company_id == group.company_id)
            .first()
        )
        if not mem:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        is_admin = mem.role == CompanyRole.ADMIN
        is_manager_of_group = False
        if mem.role == CompanyRole.MANAGER:
            in_group = (
                db.query(GroupMembership)
                .filter(GroupMembership.group_id == group.id, GroupMembership.user_id == current_user.id)
                .first()
            )
            if in_group:
                is_manager_of_group = True

        if not (is_admin or is_manager_of_group):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Must be an Admin or a Manager of this group to add members",
            )

        # Check target user membership in company
        target_mem = (
            db.query(Membership)
            .filter(Membership.user_id == target_user_id, Membership.company_id == group.company_id)
            .first()
        )
        if not target_mem:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target user is not a member of this company",
            )

        # Check if already in group
        existing_gm = (
            db.query(GroupMembership)
            .filter(GroupMembership.group_id == group.id, GroupMembership.user_id == target_user_id)
            .first()
        )
        if existing_gm:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this group",
            )

        gm = GroupMembership(group_id=group.id, user_id=target_user_id)
        db.add(gm)
        db.commit()
        db.refresh(gm)
        return gm

    @staticmethod
    def list_groups_for_user(db: Session, company_id: UUID, user_id: UUID) -> List[Group]:
        """List groups in a company that user belongs to, or all if Admin."""
        mem = (
            db.query(Membership)
            .filter(Membership.user_id == user_id, Membership.company_id == company_id)
            .first()
        )
        if not mem:
            return []

        if mem.role == CompanyRole.ADMIN:
            return db.query(Group).filter(Group.company_id == company_id).all()

        return (
            db.query(Group)
            .join(GroupMembership, Group.id == GroupMembership.group_id)
            .filter(Group.company_id == company_id, GroupMembership.user_id == user_id)
            .all()
        )
