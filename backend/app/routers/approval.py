from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.approval import Approval
from app.models.decision import Decision, DecisionStatus
from app.models.user import User
from app.schemas.approval import ApprovalCreate, ApprovalOut
from app.auth.dependencies import require_role

router = APIRouter(prefix="/decisions/{decision_id}/approvals", tags=["Approval Workflow"])


@router.post("/", response_model=ApprovalOut)
def review_decision(decision_id: int, approval: ApprovalCreate, reviewer=Depends(require_role("manager", "administrator")), db: Session = Depends(get_db)):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    if approval.decision_outcome not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="decision_outcome must be 'approved' or 'rejected'")

    user = db.query(User).filter(User.email == reviewer["email"]).first()

    new_approval = Approval(
        decision_id=decision_id,
        reviewer_id=user.id,
        decision_outcome=approval.decision_outcome,
        remarks=approval.remarks
    )
    db.add(new_approval)

    decision.status = DecisionStatus.approved if approval.decision_outcome == "approved" else DecisionStatus.rejected

    db.commit()
    db.refresh(new_approval)
    return new_approval


@router.get("/", response_model=List[ApprovalOut])
def get_approval_history(decision_id: int, db: Session = Depends(get_db)):
    return db.query(Approval).filter(Approval.decision_id == decision_id).order_by(Approval.reviewed_at.desc()).all()