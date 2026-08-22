from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import (
    require_reviewer,
    require_manager
)
from app import crud, schemas

router = APIRouter(
    prefix="/approvals",
    tags=["Approval Management"]
)

# =====================================================
# CREATE APPROVAL
# Reviewer, Manager & Administrator
# =====================================================

@router.post(
    "/",
    response_model=schemas.ApprovalResponse
)
def create_approval(

    approval: schemas.ApprovalCreate,

    db: Session = Depends(get_db),

    current_user=Depends(require_reviewer)

):

    return crud.create_approval(

        db,

        approval,

        current_user.id

    )


# =====================================================
# GET ALL APPROVALS
# Reviewer, Manager & Administrator
# =====================================================

@router.get(
    "/",
    response_model=list[schemas.ApprovalResponse]
)
def get_all_approvals(

    db: Session = Depends(get_db),

    current_user=Depends(require_reviewer)

):

    return crud.get_all_approvals(db)


# =====================================================
# GET APPROVAL BY ID
# Reviewer, Manager & Administrator
# =====================================================

@router.get(
    "/{approval_id}",
    response_model=schemas.ApprovalResponse
)
def get_approval(

    approval_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_reviewer)

):

    approval = crud.get_approval_by_id(

        db,

        approval_id

    )

    if not approval:

        raise HTTPException(

            status_code=404,

            detail="Approval not found"

        )

    return approval


# =====================================================
# GET APPROVALS BY DECISION
# Reviewer, Manager & Administrator
# =====================================================

@router.get(
    "/decision/{decision_id}",
    response_model=list[schemas.ApprovalResponse]
)
def get_decision_approvals(

    decision_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_reviewer)

):

    return crud.get_approvals_by_decision(

        db,

        decision_id

    )


# =====================================================
# UPDATE APPROVAL
# Reviewer, Manager & Administrator
# =====================================================

@router.put(
    "/{approval_id}",
    response_model=schemas.ApprovalResponse
)
def update_approval(

    approval_id: int,

    approval: schemas.ApprovalUpdate,

    db: Session = Depends(get_db),

    current_user=Depends(require_reviewer)

):

    updated = crud.update_approval(

        db,

        approval_id,

        approval,

        current_user


    )

    if not updated:

        raise HTTPException(

            status_code=404,

            detail="Approval not found"

        )

    return updated


# =====================================================
# DELETE APPROVAL
# Manager & Administrator Only
# =====================================================

@router.delete(
    "/{approval_id}"
)
def delete_approval(

    approval_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_manager)

):

    deleted = crud.delete_approval(

        db,

        approval_id,
        
        current_user

    )

    if not deleted:

        raise HTTPException(

            status_code=404,

            detail="Approval not found"

        )

    return {

        "message": "Approval deleted successfully"

    }
# =====================================================
# ESCALATE OVERDUE APPROVALS
# Manager & Administrator
# =====================================================

@router.post("/escalate-overdue")
def escalate_overdue_approvals(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    count = crud.escalate_overdue_approvals(
        db=db,
        current_user=current_user,
        escalation_hours=24
    )

    return {
        "message": "Approval escalation check completed.",
        "escalated_count": count
    }