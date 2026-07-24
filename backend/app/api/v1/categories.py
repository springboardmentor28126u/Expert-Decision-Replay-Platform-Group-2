"""
Expert Decision Replay Platform - Categories Router

Endpoints for decision category management.
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.decision_category import DecisionCategoryCreate, DecisionCategoryResponse
from app.schemas.common import MessageResponse
from app.models.decision_category import DecisionCategory
from app.models.user import User, UserRole
from app.api.deps import get_current_user, require_role

router = APIRouter()


@router.get("", response_model=List[DecisionCategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all decision categories."""
    categories = (
        db.query(DecisionCategory)
        .order_by(DecisionCategory.name)
        .all()
    )
    return categories


@router.post("", response_model=DecisionCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    data: DecisionCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Create a new decision category (Admin only)."""
    existing = db.query(DecisionCategory).filter(DecisionCategory.name == data.name).first()
    if existing:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{data.name}' already exists",
        )

    category = DecisionCategory(name=data.name, description=data.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category
