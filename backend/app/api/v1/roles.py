"""
Expert Decision Replay Platform - Roles Router

Endpoints for role management.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.schemas.role import RoleResponse
from app.models.role import Role
from app.api.deps import get_current_active_admin

router = APIRouter()


@router.get("", response_model=List[RoleResponse])
def list_roles(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin)
):
    """List all available roles (Admin only)."""
    roles = db.query(Role).all()
    return roles
