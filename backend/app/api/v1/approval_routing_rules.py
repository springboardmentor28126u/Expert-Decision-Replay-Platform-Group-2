"""
Expert Decision Replay Platform - Approval Routing Rules API Routes

Endpoints for managing conditional approval routing rules.
Rules allow dynamic modification of approval chains based on decision attributes.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.session import get_db
from app.schemas.approval_routing_rule import (
    RoutingRuleCreate,
    RoutingRuleUpdate,
    RoutingRuleResponse,
    RoutingPreviewRequest,
    RoutingPreviewResponse,
)
from app.schemas.common import MessageResponse
from app.services.approval_routing_service import ApprovalRoutingService
from app.api.deps import require_company_role, CompanyContext
from app.models.membership import CompanyRole
from app.models.approval_routing_rule import ApprovalRoutingRule
from app.core.limiter import limiter

router = APIRouter()


@router.get("", response_model=List[RoutingRuleResponse])
def list_routing_rules(
    category: str = None,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """List all routing rules for the current company, optionally filtered by category."""
    query = db.query(ApprovalRoutingRule).filter(
        ApprovalRoutingRule.company_id == ctx.company_id
    )
    if category:
        query = query.filter(ApprovalRoutingRule.category == category)
    return query.order_by(ApprovalRoutingRule.priority, ApprovalRoutingRule.created_at).all()


@router.post("", response_model=RoutingRuleResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
def create_routing_rule(
    request: Request,
    data: RoutingRuleCreate,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """Create a new routing rule (Admin only)."""
    # Validate insert_before_level is provided when using insert_before
    if data.insert_position == "insert_before" and data.insert_before_level is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="insert_before_level is required when insert_position is 'insert_before'",
        )

    rule = ApprovalRoutingRule(
        company_id=ctx.company_id,
        category=data.category,
        condition_field=data.condition_field,
        operator=data.operator,
        condition_value=data.condition_value,
        inserted_role=data.inserted_role,
        insert_position=data.insert_position,
        insert_before_level=data.insert_before_level,
        priority=data.priority,
        active=data.active,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.put("/{rule_id}", response_model=RoutingRuleResponse)
def update_routing_rule(
    rule_id: UUID,
    data: RoutingRuleUpdate,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """Update a routing rule (Admin only)."""
    rule = db.query(ApprovalRoutingRule).filter(
        ApprovalRoutingRule.id == rule_id,
        ApprovalRoutingRule.company_id == ctx.company_id,
    ).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routing rule not found",
        )

    update_data = data.model_dump(exclude_unset=True)
    
    # Validate insert_before_level if position is being changed
    if update_data.get("insert_position") == "insert_before":
        if update_data.get("insert_before_level") is None and rule.insert_before_level is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="insert_before_level is required when insert_position is 'insert_before'",
            )

    for key, value in update_data.items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}", response_model=MessageResponse)
def delete_routing_rule(
    rule_id: UUID,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """Delete a routing rule (Admin only)."""
    rule = db.query(ApprovalRoutingRule).filter(
        ApprovalRoutingRule.id == rule_id,
        ApprovalRoutingRule.company_id == ctx.company_id,
    ).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routing rule not found",
        )

    db.delete(rule)
    db.commit()
    return {"message": f"Routing rule {rule_id} deleted"}


@router.post("/preview", response_model=RoutingPreviewResponse)
def preview_routing_rules(
    data: RoutingPreviewRequest,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN, CompanyRole.MANAGER)),
):
    """Preview which routing rules would apply for given decision fields."""
    decision_fields = {
        "financial_impact": data.financial_impact,
        "risk_score": data.risk_score,
        "impact_level": data.impact_level,
    }
    return ApprovalRoutingService.preview_routing(
        db, ctx.company_id, data.category, decision_fields
    )
