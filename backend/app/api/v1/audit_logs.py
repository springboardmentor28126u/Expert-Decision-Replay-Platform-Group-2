"""
Expert Decision Replay Platform - Audit Logs API Routes

Provides system-wide audit log access for administrators.
All queries are scoped to the requesting user's company.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database.session import get_db
from app.api.deps import get_current_active_user, require_company_role, CompanyContext
from app.models.membership import CompanyRole
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    performed_by: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """
    List audit logs for the current company (Admin only).

    Supports filtering by entity_type, action, and performed_by.
    Returns paginated results ordered by created_at descending.
    """
    query = db.query(AuditLog).filter(AuditLog.company_id == ctx.company_id)

    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if action:
        query = query.filter(AuditLog.action == action)
    if performed_by:
        query = query.filter(AuditLog.performed_by == performed_by)

    total = query.count()
    logs = (
        query
        .order_by(desc(AuditLog.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

    # Batch-load performer users to avoid N+1 queries
    performer_ids = list(set(log.performed_by for log in logs))
    performers = {}
    if performer_ids:
        users = db.query(User).filter(User.id.in_(performer_ids)).all()
        performers = {u.id: u for u in users}

    # Enrich with performer names
    items = []
    for log in logs:
        performer = performers.get(log.performed_by)
        items.append({
            "id": str(log.id),
            "entity_type": log.entity_type,
            "entity_id": str(log.entity_id),
            "action": log.action,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "performed_by": str(log.performed_by),
            "performer_name": performer.full_name if performer else "Unknown",
            "created_at": log.created_at.isoformat() if log.created_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/actions", response_model=List[str])
def list_audit_actions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """List all distinct audit actions for the current company."""
    actions = (
        db.query(AuditLog.action)
        .filter(AuditLog.company_id == ctx.company_id)
        .distinct()
        .all()
    )
    return [a[0] for a in actions]


@router.get("/entity-types", response_model=List[str])
def list_audit_entity_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """List all distinct entity types for the current company."""
    types = (
        db.query(AuditLog.entity_type)
        .filter(AuditLog.company_id == ctx.company_id)
        .distinct()
        .all()
    )
    return [t[0] for t in types]
