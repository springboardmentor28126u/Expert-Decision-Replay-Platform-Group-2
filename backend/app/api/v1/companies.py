"""
Expert Decision Replay Platform - Companies Router

Endpoints for multi-tenant company management and invitations.
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.company import (
    CompanyCreate,
    CompanyResponse,
    CompanyWithRole,
    CompanyInvite,
)
from app.services.company_service import CompanyService

router = APIRouter()


@router.get("/me", response_model=List[CompanyWithRole])
def get_my_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all companies the current user belongs to, with their role in each.
    Called post-login to select or inspect company contexts (like GitHub orgs).
    """
    company_roles = CompanyService.list_user_companies(db, current_user.id)
    result = []
    for company, role in company_roles:
        result.append(
            CompanyWithRole(
                id=company.id,
                name=company.name,
                slug=company.slug,
                role=role,
                created_at=company.created_at,
            )
        )
    return result


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    data: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new Company (tenant).
    The creating user automatically receives a Membership with role=admin.
    """
    company, _ = CompanyService.create_company(
        db=db,
        name=data.name,
        creator_id=current_user.id,
        slug=data.slug,
    )
    return company


@router.post("/{company_id}/invite", status_code=status.HTTP_200_OK)
def invite_to_company(
    company_id: UUID,
    data: CompanyInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Invite a user by email to join a company with a given role.
    Only company Admins can issue invitations.
    """
    membership = CompanyService.invite_user(
        db=db,
        company_id=company_id,
        inviter_user=current_user,
        email=data.email,
        role=data.role,
    )
    return {
        "message": f"Successfully invited {data.email} as {data.role.value}",
        "membership_id": membership.id,
    }
