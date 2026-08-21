"""
Expert Decision Replay Platform - Approval Chains Router

Admin-only endpoints for managing approval chain configurations per company.
All endpoints enforce tenant isolation via CompanyContext.
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_company_context_by_id, CompanyContext
from app.models.membership import CompanyRole
from app.schemas.approval_chain import (
    ApprovalChainCreate,
    ApprovalChainUpdate,
    ApprovalChainResponse,
    ApprovalChainCheckResponse,
)
from app.services.approval_chain_service import ApprovalChainService

router = APIRouter()


def _require_admin(ctx: CompanyContext) -> CompanyContext:
    """Verify the caller is an Admin in this company."""
    if ctx.role != CompanyRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company Admins can manage approval chains",
        )
    return ctx


def _enrich_response(chain) -> dict:
    """Build a response dict with group_name populated."""
    data = {
        "id": chain.id,
        "company_id": chain.company_id,
        "group_id": chain.group_id,
        "category": chain.category,
        "levels": chain.levels or [],
        "sla_hours": chain.sla_hours,
        "created_at": chain.created_at,
        "group_name": chain.group.name if chain.group else None,
    }
    return data


# ------------------------------------------------------------------ #
#  POST /companies/{company_id}/approval-chains                       #
# ------------------------------------------------------------------ #
@router.post(
    "/{company_id}/approval-chains",
    response_model=ApprovalChainResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_approval_chain(
    company_id: UUID,
    data: ApprovalChainCreate,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context_by_id),
):
    """Create a new approval chain configuration for a company."""
    _require_admin(ctx)
    chain = ApprovalChainService.create(db, company_id, data)
    # Reload to get relationships
    db.refresh(chain)
    return _enrich_response(chain)


# ------------------------------------------------------------------ #
#  GET /companies/{company_id}/approval-chains                        #
# ------------------------------------------------------------------ #
@router.get(
    "/{company_id}/approval-chains",
    response_model=List[ApprovalChainResponse],
)
def list_approval_chains(
    company_id: UUID,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context_by_id),
):
    """List all approval chain configurations for a company."""
    _require_admin(ctx)
    chains = ApprovalChainService.list_by_company(db, company_id)
    return [_enrich_response(c) for c in chains]


# ------------------------------------------------------------------ #
#  GET /companies/{company_id}/approval-chains/check                  #
# ------------------------------------------------------------------ #
@router.get(
    "/{company_id}/approval-chains/check",
    response_model=ApprovalChainCheckResponse,
)
def check_approval_chain(
    company_id: UUID,
    category: str = Query(..., description="Category name to check"),
    group_id: Optional[UUID] = Query(None, description="Optional group ID"),
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context_by_id),
):
    """Check if an approval chain exists for a category+group combination.

    Available to all company members (not just admins) — used by the
    Create Decision form to warn users proactively.
    """
    has_chain, chain, admin_user, missing_role = ApprovalChainService.check_chain_exists(
        db, company_id, category, group_id, exclude_user_id=ctx.user.id,
    )
    return ApprovalChainCheckResponse(
        has_chain=has_chain,
        chain=_enrich_response(chain) if chain else None,
        admin_name=admin_user.full_name if admin_user else None,
        admin_email=admin_user.email if admin_user else None,
        approver_ok=(missing_role is None) if (has_chain and group_id) else None,
        missing_role=missing_role,
    )


# ------------------------------------------------------------------ #
#  PUT /companies/{company_id}/approval-chains/{chain_id}             #
# ------------------------------------------------------------------ #
@router.put(
    "/{company_id}/approval-chains/{chain_id}",
    response_model=ApprovalChainResponse,
)
def update_approval_chain(
    chain_id: UUID,
    data: ApprovalChainUpdate,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context_by_id),
):
    """Update an existing approval chain configuration."""
    _require_admin(ctx)
    chain = ApprovalChainService.update(db, chain_id, data, ctx.company_id)
    db.refresh(chain)
    return _enrich_response(chain)


# ------------------------------------------------------------------ #
#  DELETE /companies/{company_id}/approval-chains/{chain_id}          #
# ------------------------------------------------------------------ #
@router.delete(
    "/{company_id}/approval-chains/{chain_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_approval_chain(
    chain_id: UUID,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context_by_id),
):
    """Delete an approval chain configuration."""
    _require_admin(ctx)
    ApprovalChainService.delete(db, chain_id, ctx.company_id)
