"""
Expert Decision Replay Platform - Roles API Routes

Provides read-only access to the predefined system roles.
Roles are company-scoped and returned from the Membership model.
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_active_user, require_company_role
from app.models.membership import CompanyRole
from app.schemas.role import RoleResponse

router = APIRouter()


@router.get("/", response_model=List[RoleResponse])
def list_roles(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
    company_context=Depends(require_company_role(CompanyRole.EMPLOYEE)),
):
    """
    List all available system roles.

    Returns the predefined company roles (ADMIN, MANAGER, REVIEWER, EMPLOYEE).
    Any authenticated user can view available roles.
    """
    roles = [
        RoleResponse(
            id="00000000-0000-0000-0000-000000000001",
            name=CompanyRole.ADMIN.value,
            description="Full system administrator with all permissions",
        ),
        RoleResponse(
            id="00000000-0000-0000-0000-000000000002",
            name=CompanyRole.MANAGER.value,
            description="Team manager with approval and group management permissions",
        ),
        RoleResponse(
            id="00000000-0000-0000-0000-000000000003",
            name=CompanyRole.REVIEWER.value,
            description="Decision reviewer with approval permissions",
        ),
        RoleResponse(
            id="00000000-0000-0000-0000-000000000004",
            name=CompanyRole.EMPLOYEE.value,
            description="Standard employee with decision creation permissions",
        ),
    ]
    return roles
