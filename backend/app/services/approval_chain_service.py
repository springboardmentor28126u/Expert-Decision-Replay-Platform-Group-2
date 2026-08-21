"""
Expert Decision Replay Platform - Approval Chain Service

Business logic for CRUD operations on ApprovalChainConfig and the
chain-lookup logic used during decision submission.
"""

from typing import List, Optional, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.approval_chain import ApprovalChainConfig
from app.models.group import Group
from app.models.group_membership import GroupMembership
from app.models.membership import Membership, CompanyRole
from app.models.user import User
from app.schemas.approval_chain import ApprovalChainCreate, ApprovalChainUpdate


class ApprovalChainService:
    """Service for managing approval chain configurations."""

    # ------------------------------------------------------------------ #
    #  CREATE                                                              #
    # ------------------------------------------------------------------ #
    @staticmethod
    def create(
        db: Session,
        company_id: UUID,
        data: ApprovalChainCreate,
    ) -> ApprovalChainConfig:
        """Create a new approval chain config for a company."""
        # Validate group belongs to company (if specified)
        if data.group_id:
            group = (
                db.query(Group)
                .filter(Group.id == data.group_id, Group.company_id == company_id)
                .first()
            )
            if not group:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Group not found in this company",
                )

        # Check for duplicate (company + group + category)
        existing = (
            db.query(ApprovalChainConfig)
            .filter(
                ApprovalChainConfig.company_id == company_id,
                ApprovalChainConfig.category == data.category,
            )
        )
        if data.group_id:
            existing = existing.filter(ApprovalChainConfig.group_id == data.group_id)
        else:
            existing = existing.filter(ApprovalChainConfig.group_id.is_(None))

        if existing.first():
            scope = f"group '{data.group_id}'" if data.group_id else "company-wide"
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An approval chain for category '{data.category}' ({scope}) already exists",
            )

        # Validate and normalize levels
        levels_data = [{"level": lvl.level, "role": lvl.role} for lvl in data.levels]

        chain = ApprovalChainConfig(
            company_id=company_id,
            group_id=data.group_id,
            category=data.category,
            levels=levels_data,
            sla_hours=data.sla_hours,
        )
        db.add(chain)
        db.commit()
        db.refresh(chain)
        return chain

    # ------------------------------------------------------------------ #
    #  LIST                                                                #
    # ------------------------------------------------------------------ #
    @staticmethod
    def list_by_company(
        db: Session,
        company_id: UUID,
    ) -> List[ApprovalChainConfig]:
        """List all approval chain configs for a company."""
        return (
            db.query(ApprovalChainConfig)
            .filter(ApprovalChainConfig.company_id == company_id)
            .order_by(ApprovalChainConfig.category, ApprovalChainConfig.group_id)
            .all()
        )

    # ------------------------------------------------------------------ #
    #  GET BY ID                                                           #
    # ------------------------------------------------------------------ #
    @staticmethod
    def get_by_id(
        db: Session,
        chain_id: UUID,
        company_id: UUID,
    ) -> ApprovalChainConfig:
        """Get a single chain config, enforcing company ownership."""
        chain = db.query(ApprovalChainConfig).filter(
            ApprovalChainConfig.id == chain_id,
        ).first()
        if not chain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Approval chain config not found",
            )
        if chain.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: chain belongs to a different company",
            )
        return chain

    # ------------------------------------------------------------------ #
    #  UPDATE                                                              #
    # ------------------------------------------------------------------ #
    @staticmethod
    def update(
        db: Session,
        chain_id: UUID,
        data: ApprovalChainUpdate,
        company_id: UUID,
    ) -> ApprovalChainConfig:
        """Update an existing approval chain config."""
        chain = ApprovalChainService.get_by_id(db, chain_id, company_id)

        update_fields = data.model_dump(exclude_unset=True)

        if "group_id" in update_fields and update_fields["group_id"] is not None:
            group = (
                db.query(Group)
                .filter(
                    Group.id == update_fields["group_id"],
                    Group.company_id == company_id,
                )
                .first()
            )
            if not group:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Group not found in this company",
                )

        if "levels" in update_fields and update_fields["levels"] is not None:
            update_fields["levels"] = [
                {"level": lvl.level, "role": lvl.role}
                if hasattr(lvl, "level") else lvl
                for lvl in (data.levels or [])
            ]

        for key, value in update_fields.items():
            setattr(chain, key, value)

        db.commit()
        db.refresh(chain)
        return chain

    # ------------------------------------------------------------------ #
    #  DELETE                                                              #
    # ------------------------------------------------------------------ #
    @staticmethod
    def delete(
        db: Session,
        chain_id: UUID,
        company_id: UUID,
    ) -> None:
        """Delete an approval chain config."""
        chain = ApprovalChainService.get_by_id(db, chain_id, company_id)
        db.delete(chain)
        db.commit()

    # ------------------------------------------------------------------ #
    #  CHAIN LOOKUP (used by decision submit)                              #
    # ------------------------------------------------------------------ #
    @staticmethod
    def find_chain_for_submission(
        db: Session,
        company_id: UUID,
        group_id: UUID,
        category_name: str,
    ) -> Optional[ApprovalChainConfig]:
        """
        Find the best-matching approval chain config using a fallback strategy:

        1. Group-specific config for this category
        2. Company-wide default for this category (group_id IS NULL)
        3. Company-wide "default" category (group_id IS NULL, category='default')

        Returns None if nothing matches — caller should raise a specific error.
        """
        # 1. Group-specific + exact category
        chain = (
            db.query(ApprovalChainConfig)
            .filter(
                ApprovalChainConfig.company_id == company_id,
                ApprovalChainConfig.group_id == group_id,
                ApprovalChainConfig.category == category_name,
            )
            .first()
        )
        if chain:
            return chain

        # 2. Company-wide + exact category
        chain = (
            db.query(ApprovalChainConfig)
            .filter(
                ApprovalChainConfig.company_id == company_id,
                ApprovalChainConfig.group_id.is_(None),
                ApprovalChainConfig.category == category_name,
            )
            .first()
        )
        if chain:
            return chain

        # 3. Company-wide "default" category
        chain = (
            db.query(ApprovalChainConfig)
            .filter(
                ApprovalChainConfig.company_id == company_id,
                ApprovalChainConfig.group_id.is_(None),
                ApprovalChainConfig.category == "default",
            )
            .first()
        )
        return chain

    # ------------------------------------------------------------------ #
    #  APPROVER RESOLUTION (used by submit + pre-check)                    #
    # ------------------------------------------------------------------ #
    @staticmethod
    def find_eligible_approver(
        db: Session,
        company_id: UUID,
        group_id: UUID,
        role_str: str,
        exclude_user_id: UUID,
    ) -> Optional[User]:
        """
        Find the best eligible approver for a chain level:
        1. An active member of the group whose company role matches the level.
        2. Fallback: an active member of the group with the ADMIN role.

        The submitter is always excluded so decisions cannot self-approve.
        Returns None when nobody is eligible.
        """
        base = (
            db.query(User)
            .join(Membership, User.id == Membership.user_id)
            .join(GroupMembership, GroupMembership.user_id == User.id)
            .filter(
                Membership.company_id == company_id,
                GroupMembership.group_id == group_id,
                GroupMembership.is_active == True,  # noqa: E712
                User.id != exclude_user_id,
            )
        )
        approver = (
            base.filter(Membership.role == role_str)
            .order_by(User.created_at)
            .first()
        )
        if not approver:
            approver = (
                base.filter(Membership.role == CompanyRole.ADMIN)
                .order_by(User.created_at)
                .first()
            )
        return approver

    # ------------------------------------------------------------------ #
    #  CHECK (used by frontend pre-validation)                             #
    # ------------------------------------------------------------------ #
    @staticmethod
    def check_chain_exists(
        db: Session,
        company_id: UUID,
        category_name: str,
        group_id: Optional[UUID] = None,
        exclude_user_id: Optional[UUID] = None,
    ) -> Tuple[bool, Optional[ApprovalChainConfig], Optional[User], Optional[str]]:
        """
        Check if a chain config exists for a given category+group.
        Returns (has_chain, chain_or_none, company_admin_or_none, missing_role_or_none).
        missing_role is set when a chain exists but no eligible approver can fill
        one of its levels for the given group.
        """
        effective_group = group_id if group_id else None
        chain = ApprovalChainService.find_chain_for_submission(
            db, company_id, effective_group, category_name,
        ) if effective_group else None

        # If no group specified, just check company-wide
        if not effective_group:
            chain = (
                db.query(ApprovalChainConfig)
                .filter(
                    ApprovalChainConfig.company_id == company_id,
                    ApprovalChainConfig.group_id.is_(None),
                    ApprovalChainConfig.category == category_name,
                )
                .first()
            )
            if not chain:
                chain = (
                    db.query(ApprovalChainConfig)
                    .filter(
                        ApprovalChainConfig.company_id == company_id,
                        ApprovalChainConfig.group_id.is_(None),
                        ApprovalChainConfig.category == "default",
                    )
                    .first()
                )

        # Find a company admin for contact info
        admin_user = None
        if not chain:
            admin_membership = (
                db.query(Membership)
                .filter(
                    Membership.company_id == company_id,
                    Membership.role == CompanyRole.ADMIN,
                )
                .first()
            )
            if admin_membership:
                admin_user = db.query(User).filter(User.id == admin_membership.user_id).first()

        # Check that the chain's levels can actually be staffed for this group
        missing_role = None
        if chain and effective_group and exclude_user_id:
            for lvl in chain.levels or []:
                role_str = lvl["role"] if isinstance(lvl, dict) else lvl
                if not ApprovalChainService.find_eligible_approver(
                    db, company_id, effective_group, role_str, exclude_user_id,
                ):
                    missing_role = role_str
                    break

        return (chain is not None, chain, admin_user, missing_role)
