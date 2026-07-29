"""
Expert Decision Replay Platform - Group Service

Business logic for group creation and membership management within a company.
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.group import Group
from app.models.group_membership import GroupMembership
from app.models.group_join_request import GroupJoinRequest, GroupJoinRequestStatus
from app.models.membership import Membership, CompanyRole
from app.models.user import User, UserRole
from app.services.notification_service import NotificationService


class GroupService:
    @staticmethod
    def _initial(name: str | None) -> str:
        return (name or "U").strip()[:1].upper() or "U"

    @staticmethod
    def _request_to_response(join_request: GroupJoinRequest) -> dict:
        group = join_request.group
        requester = join_request.requester
        owner = join_request.request_owner
        return {
            "id": join_request.id,
            "group_id": join_request.group_id,
            "group_name": group.name if group else "",
            "group_description": group.description if group else None,
            "requested_by": join_request.requested_by,
            "requester_name": requester.full_name if requester else "",
            "requester_initial": GroupService._initial(requester.full_name if requester else None),
            "requested_to": join_request.requested_to,
            "owner_name": owner.full_name if owner else "",
            "owner_initial": GroupService._initial(owner.full_name if owner else None),
            "status": join_request.status.value if hasattr(join_request.status, "value") else join_request.status,
            "message": join_request.message,
            "decided_at": join_request.decided_at,
            "decided_by": join_request.decided_by,
            "created_at": join_request.created_at,
            "updated_at": join_request.updated_at,
        }

    @staticmethod
    def _normalize_name(name: str) -> str:
        return name.strip()

    @staticmethod
    def _ensure_unique_group_name(
        db: Session,
        company_id: UUID,
        name: str,
        exclude_group_id: Optional[UUID] = None,
    ) -> None:
        normalized = GroupService._normalize_name(name)
        if not normalized:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Group name is required",
            )
        query = db.query(Group).filter(
            Group.company_id == company_id,
            func.lower(Group.name) == normalized.lower(),
        )
        if exclude_group_id:
            query = query.filter(Group.id != exclude_group_id)
        if query.first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A group with this name already exists",
            )

    @staticmethod
    def _group_counts(db: Session, group_id: UUID) -> tuple[int, int]:
        member_count = (
            db.query(func.count(GroupMembership.id))
            .filter(
                GroupMembership.group_id == group_id,
                GroupMembership.is_active == True,  # noqa: E712
            )
            .scalar()
        ) or 0
        pending_count = (
            db.query(func.count(GroupJoinRequest.id))
            .filter(
                GroupJoinRequest.group_id == group_id,
                GroupJoinRequest.status == GroupJoinRequestStatus.PENDING,
            )
            .scalar()
        ) or 0
        return member_count, pending_count

    @staticmethod
    def _group_to_admin_list_item(db: Session, group: Group) -> dict:
        member_count, pending_count = GroupService._group_counts(db, group.id)
        return {
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "department": group.department,
            "owner_id": group.owner_id,
            "member_count": member_count,
            "pending_request_count": pending_count,
            "is_active": group.is_active,
            "created_at": group.created_at,
        }

    @staticmethod
    def create_admin_group(
        db: Session,
        company_id: UUID,
        current_user: User,
        name: str,
        description: Optional[str] = None,
        department: Optional[str] = None,
    ) -> dict:
        """Create a group owned by the current admin or manager. Auto-adds owner as member."""
        mem = (
            db.query(Membership)
            .filter(Membership.user_id == current_user.id, Membership.company_id == company_id)
            .first()
        )
        if not mem:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this company")
        if mem.role not in (CompanyRole.ADMIN, CompanyRole.MANAGER) and current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Admins or Managers can create groups",
            )

        normalized_name = GroupService._normalize_name(name)
        GroupService._ensure_unique_group_name(db, company_id, normalized_name)

        group = Group(
            company_id=company_id,
            name=normalized_name,
            description=str(description).strip() if description else None,
            department=str(department).strip() if department else None,
            owner_id=current_user.id,
            is_active=True,
        )
        db.add(group)
        db.flush()

        gm = GroupMembership(group_id=group.id, user_id=current_user.id, is_active=True)
        db.add(gm)

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A group with this name already exists",
            )
        db.refresh(group)
        return GroupService._group_to_admin_list_item(db, group)

    @staticmethod
    def list_admin_groups(db: Session, company_id: UUID, current_user: User) -> List[dict]:
        """List groups scoped for admin dashboard: company admins see all; Managers see owned groups only."""
        mem = (
            db.query(Membership)
            .filter(Membership.user_id == current_user.id, Membership.company_id == company_id)
            .first()
        )
        if not mem:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this company")

        query = db.query(Group).filter(Group.company_id == company_id)
        if mem.role != CompanyRole.ADMIN and current_user.role != UserRole.ADMIN:
            query = query.filter(Group.owner_id == current_user.id)
        groups = query.order_by(Group.name).all()
        return [GroupService._group_to_admin_list_item(db, group) for group in groups]

    @staticmethod
    def get_admin_group_detail(
        db: Session,
        company_id: UUID,
        group_id: UUID,
        current_user: User,
    ) -> dict:
        group = db.query(Group).filter(Group.id == group_id, Group.company_id == company_id).first()
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        if not GroupService._can_manage_group_requests(db, group, current_user):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view groups you own")

        memberships = (
            db.query(GroupMembership)
            .filter(
                GroupMembership.group_id == group_id,
                GroupMembership.is_active == True,  # noqa: E712
            )
            .all()
        )
        members = []
        for gm in memberships:
            user = db.query(User).filter(User.id == gm.user_id).first()
            members.append(
                {
                    "id": gm.id,
                    "group_id": gm.group_id,
                    "user_id": gm.user_id,
                    "created_at": gm.created_at,
                    "joined_at": gm.joined_at,
                    "is_active": gm.is_active,
                    "full_name": user.full_name if user else None,
                    "email": user.email if user else None,
                }
            )

        pending_requests = GroupService.list_join_requests_for_group(
            db, group_id, current_user, status_filter=GroupJoinRequestStatus.PENDING.value
        )

        detail = GroupService._group_to_admin_list_item(db, group)
        detail["members"] = members
        detail["pending_requests"] = pending_requests
        return detail

    @staticmethod
    def update_admin_group(
        db: Session,
        company_id: UUID,
        group_id: UUID,
        current_user: User,
        name: Optional[str] = None,
        description: Optional[str] = None,
        department: Optional[str] = None,
    ) -> dict:
        group = db.query(Group).filter(Group.id == group_id, Group.company_id == company_id).first()
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        if not GroupService._can_manage_group_requests(db, group, current_user):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit groups you own")

        if name is not None:
            normalized_name = GroupService._normalize_name(name)
            GroupService._ensure_unique_group_name(db, group.company_id, normalized_name, exclude_group_id=group.id)
            group.name = normalized_name
        if description is not None:
            group.description = description.strip() if description else None
        if department is not None:
            group.department = department.strip() if department else None

        db.commit()
        db.refresh(group)
        return GroupService._group_to_admin_list_item(db, group)

    @staticmethod
    def deactivate_admin_group(db: Session, company_id: UUID, group_id: UUID, current_user: User) -> dict:
        """Soft-deactivate a group. Preserves members and audit history; hides from browse/join."""
        group = db.query(Group).filter(Group.id == group_id, Group.company_id == company_id).first()
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        if not GroupService._can_manage_group_requests(db, group, current_user):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only deactivate groups you own")
        if not group.is_active:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Group is already deactivated")

        _, pending_count = GroupService._group_counts(db, group.id)
        if pending_count > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot deactivate a group with pending join requests",
            )

        group.is_active = False
        db.commit()
        db.refresh(group)
        return GroupService._group_to_admin_list_item(db, group)

    @staticmethod
    def create_group(
        db: Session,
        company_id: UUID,
        current_user: User,
        name: str,
        description: Optional[str] = None,
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

        normalized_name = GroupService._normalize_name(name)
        GroupService._ensure_unique_group_name(db, company_id, normalized_name)

        group = Group(company_id=company_id, name=normalized_name, description=description, owner_id=current_user.id)
        db.add(group)
        db.flush()

        gm = GroupMembership(group_id=group.id, user_id=current_user.id, is_active=True)
        db.add(gm)

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A group with this name already exists",
            )
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
        Allowed for company Admins, Managers who are members or owners of the group.
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

        is_system_admin = current_user.role == UserRole.ADMIN
        is_company_admin = mem.role == CompanyRole.ADMIN
        is_group_owner = group.owner_id == current_user.id
        is_manager_of_group = False
        if mem.role == CompanyRole.MANAGER:
            in_group = (
                db.query(GroupMembership)
                .filter(
                    GroupMembership.group_id == group.id,
                    GroupMembership.user_id == current_user.id,
                    GroupMembership.is_active == True,  # noqa: E712
                )
                .first()
            )
            if in_group:
                is_manager_of_group = True

        if not (is_system_admin or is_company_admin or is_group_owner or is_manager_of_group):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Must be an Admin, or a Manager/owner of this group to add members",
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
        if existing_gm and existing_gm.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this group",
            )
        if existing_gm:
            existing_gm.is_active = True
            existing_gm.joined_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(existing_gm)
            return existing_gm

        gm = GroupMembership(group_id=group.id, user_id=target_user_id, is_active=True)
        db.add(gm)
        db.commit()
        db.refresh(gm)
        return gm

    @staticmethod
    def list_groups_for_user(db: Session, company_id: UUID, user_id: UUID) -> List[Group]:
        """List groups in a company that user belongs to or owns, or all if Admin."""
        mem = (
            db.query(Membership)
            .filter(Membership.user_id == user_id, Membership.company_id == company_id)
            .first()
        )
        if not mem:
            return []

        if mem.role == CompanyRole.ADMIN:
            return db.query(Group).filter(Group.company_id == company_id).all()

        if mem.role == CompanyRole.MANAGER:
            member_group_ids = (
                db.query(GroupMembership.group_id)
                .filter(
                    GroupMembership.user_id == user_id,
                    GroupMembership.is_active == True,  # noqa: E712
                )
                .subquery()
            )
            return (
                db.query(Group)
                .filter(
                    Group.company_id == company_id,
                    (Group.owner_id == user_id) | (Group.id.in_(member_group_ids)),
                )
                .all()
            )

        return (
            db.query(Group)
            .join(GroupMembership, Group.id == GroupMembership.group_id)
            .filter(
                Group.company_id == company_id,
                GroupMembership.user_id == user_id,
                GroupMembership.is_active == True,  # noqa: E712
            )
            .all()
        )

    @staticmethod
    def list_available_groups(db: Session, company_id: UUID, current_user: User) -> List[dict]:
        """List company groups the current user has not actively joined. Only Employees/Reviewers."""
        mem = (
            db.query(Membership)
            .filter(Membership.user_id == current_user.id, Membership.company_id == company_id)
            .first()
        )
        if not mem:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this company")
        if mem.role in (CompanyRole.ADMIN, CompanyRole.MANAGER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only employees can browse available groups",
            )

        active_group_ids = (
            db.query(GroupMembership.group_id)
            .filter(
                GroupMembership.user_id == current_user.id,
                GroupMembership.is_active == True,  # noqa: E712
            )
            .subquery()
        )

        groups = (
            db.query(Group)
            .filter(
                Group.company_id == company_id,
                Group.is_active == True,  # noqa: E712
                ~Group.id.in_(active_group_ids),
            )
            .order_by(Group.name)
            .all()
        )

        pending_requests = {
            req.group_id: req
            for req in db.query(GroupJoinRequest)
            .filter(
                GroupJoinRequest.requested_by == current_user.id,
                GroupJoinRequest.status == GroupJoinRequestStatus.PENDING,
            )
            .all()
        }

        rows = []
        for group in groups:
            member_count = (
                db.query(func.count(GroupMembership.id))
                .filter(
                    GroupMembership.group_id == group.id,
                    GroupMembership.is_active == True,  # noqa: E712
                )
                .scalar()
            )
            pending = pending_requests.get(group.id)
            rows.append(
                {
                    "id": group.id,
                    "company_id": group.company_id,
                    "name": group.name,
                    "description": group.description,
                    "owner": {
                        "id": group.owner.id,
                        "full_name": group.owner.full_name,
                        "avatar_initial": GroupService._initial(group.owner.full_name),
                    },
                    "member_count": member_count,
                    "pending_request_id": pending.id if pending else None,
                    "pending_request_status": pending.status.value if pending else None,
                }
            )
        return rows

    @staticmethod
    def request_to_join_group(
        db: Session,
        group_id: UUID,
        current_user: User,
        message: Optional[str] = None,
    ) -> GroupJoinRequest:
        """Create an in-app request for current_user to join a group."""
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

        if not group.is_active:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This group is no longer accepting join requests")

        membership = (
            db.query(Membership)
            .filter(Membership.user_id == current_user.id, Membership.company_id == group.company_id)
            .first()
        )
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this company")
        if membership.role in (CompanyRole.ADMIN, CompanyRole.MANAGER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only employees can request to join groups",
            )

        active_membership = (
            db.query(GroupMembership)
            .filter(
                GroupMembership.group_id == group_id,
                GroupMembership.user_id == current_user.id,
                GroupMembership.is_active == True,  # noqa: E712
            )
            .first()
        )
        if active_membership:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You are already a member of this group")

        existing_pending = (
            db.query(GroupJoinRequest)
            .filter(
                GroupJoinRequest.group_id == group_id,
                GroupJoinRequest.requested_by == current_user.id,
                GroupJoinRequest.status == GroupJoinRequestStatus.PENDING,
            )
            .first()
        )
        if existing_pending:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A pending request already exists for this group")

        join_request = GroupJoinRequest(
            group_id=group.id,
            requested_by=current_user.id,
            requested_to=group.owner_id,
            status=GroupJoinRequestStatus.PENDING,
            message=message,
        )
        db.add(join_request)

        NotificationService.create_in_app(
            db,
            user_id=group.owner_id,
            type="join_request",
            title="New group join request",
            message=f"{current_user.full_name} requested to join {group.name}",
            payload={
                "request_id": str(join_request.id),
                "requester_id": str(current_user.id),
                "requester_name": current_user.full_name,
                "group_id": str(group.id),
                "group_name": group.name,
            },
        )

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A pending request already exists for this group")
        db.refresh(join_request)
        return join_request

    @staticmethod
    def _can_manage_group_requests(db: Session, group: Group, current_user: User) -> bool:
        """Company admins may manage all company requests; group owners manage their own group."""
        mem = (
            db.query(Membership)
            .filter(Membership.user_id == current_user.id, Membership.company_id == group.company_id)
            .first()
        )
        if not mem:
            return False
        if current_user.role == UserRole.ADMIN:
            return True
        return bool(mem.role == CompanyRole.ADMIN or group.owner_id == current_user.id)

    @staticmethod
    def list_join_requests_for_group(
        db: Session,
        group_id: UUID,
        current_user: User,
        status_filter: Optional[str] = "pending",
    ) -> List[dict]:
        """List join requests for one group, scoped to owner or company admin."""
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        if not GroupService._can_manage_group_requests(db, group, current_user):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view requests for groups you own")

        query = db.query(GroupJoinRequest).filter(GroupJoinRequest.group_id == group_id)
        if status_filter:
            try:
                query = query.filter(GroupJoinRequest.status == GroupJoinRequestStatus(status_filter))
            except ValueError:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid request status")
        return [GroupService._request_to_response(req) for req in query.order_by(GroupJoinRequest.created_at.desc()).all()]

    @staticmethod
    def list_join_requests_for_admin(
        db: Session,
        company_id: UUID,
        current_user: User,
        status_filter: Optional[str] = "pending",
        group_id: Optional[UUID] = None,
    ) -> List[dict]:
        """List join requests for groups this caller owns, or all company groups for company admins."""
        mem = (
            db.query(Membership)
            .filter(Membership.user_id == current_user.id, Membership.company_id == company_id)
            .first()
        )
        if not mem:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this company")

        query = db.query(GroupJoinRequest).join(Group).filter(Group.company_id == company_id)
        if mem.role != CompanyRole.ADMIN and current_user.role != UserRole.ADMIN:
            query = query.filter(Group.owner_id == current_user.id)

        if group_id:
            query = query.filter(GroupJoinRequest.group_id == group_id)

        if status_filter:
            try:
                query = query.filter(GroupJoinRequest.status == GroupJoinRequestStatus(status_filter))
            except ValueError:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid request status")

        return [GroupService._request_to_response(req) for req in query.order_by(GroupJoinRequest.created_at.desc()).all()]

    @staticmethod
    def decide_join_request(
        db: Session,
        request_id: UUID,
        current_user: User,
        decision: str,
    ) -> GroupJoinRequest:
        """Accept or reject a pending join request atomically."""
        join_request = (
            db.query(GroupJoinRequest)
            .filter(GroupJoinRequest.id == request_id)
            .first()
        )
        if not join_request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Join request not found")

        group = join_request.group
        if not GroupService._can_manage_group_requests(db, group, current_user):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only decide requests for groups you own")

        if join_request.status != GroupJoinRequestStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This join request has already been decided")

        now = datetime.now(timezone.utc)
        if decision == "accept":
            existing_membership = (
                db.query(GroupMembership)
                .filter(
                    GroupMembership.group_id == join_request.group_id,
                    GroupMembership.user_id == join_request.requested_by,
                )
                .first()
            )
            if existing_membership:
                existing_membership.is_active = True
                existing_membership.joined_at = now
            else:
                db.add(
                    GroupMembership(
                        group_id=join_request.group_id,
                        user_id=join_request.requested_by,
                        joined_at=now,
                        is_active=True,
                    )
                )

            join_request.status = GroupJoinRequestStatus.ACCEPTED
            notification_message = f"Your request to join {group.name} was accepted"
        else:
            join_request.status = GroupJoinRequestStatus.REJECTED
            notification_message = f"Your request to join {group.name} was not accepted"

        join_request.decided_at = now
        join_request.decided_by = current_user.id

        NotificationService.create_in_app(
            db,
            user_id=join_request.requested_by,
            type="join_request_decision",
            title="Group join request updated",
            message=notification_message,
            payload={
                "request_id": str(join_request.id),
                "group_id": str(group.id),
                "group_name": group.name,
                "decision": decision,
            },
        )

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a member of this group")
        db.refresh(join_request)
        return join_request

    @staticmethod
    def list_my_join_requests(db: Session, current_user: User) -> List[dict]:
        """List all join requests created by the current user."""
        requests = (
            db.query(GroupJoinRequest)
            .filter(GroupJoinRequest.requested_by == current_user.id)
            .order_by(GroupJoinRequest.created_at.desc())
            .all()
        )
        return [GroupService._request_to_response(req) for req in requests]

    @staticmethod
    def pending_join_request_count(db: Session, company_id: UUID, current_user: User) -> int:
        """Count pending requests visible to the caller."""
        return len(
            GroupService.list_join_requests_for_admin(
                db=db,
                company_id=company_id,
                current_user=current_user,
                status_filter=GroupJoinRequestStatus.PENDING.value,
            )
        )
