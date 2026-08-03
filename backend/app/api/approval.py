from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.decision import Decision
from app.models.approval import Approval
from app.models.notification import Notification

router = APIRouter(
    prefix="/approvals",
    tags=["Approvals"]
)


@router.post("/{decision_id}")
def approve_decision(
    decision_id: int,
    status: str,
    remarks: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only Reviewer, Manager or Administrator can approve
    if current_user.role not in ["Reviewer", "Manager", "Administrator"]:
        raise HTTPException(
            status_code=403,
            detail="Only Reviewer, Manager or Administrator can approve decisions"
        )

    decision = db.query(Decision).filter(
        Decision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    approval = Approval(
        decision_id=decision.id,
        reviewer_id=current_user.id,
        status=status,
        remarks=remarks
    )

    db.add(approval)

    # Update decision status
    # Update decision status
    decision.status = status

    # Create notification for the decision creator
    notification = Notification(
    user_id=decision.created_by,
    message=f"Your decision '{decision.title}' has been {status}."
    )

    db.add(notification)

    db.commit()

    return {
        "message": f"Decision {status.lower()} successfully"
    }


@router.get("/{decision_id}")
def approval_history(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    approvals = (
        db.query(Approval)
        .filter(Approval.decision_id == decision_id)
        .all()
    )

    return approvals