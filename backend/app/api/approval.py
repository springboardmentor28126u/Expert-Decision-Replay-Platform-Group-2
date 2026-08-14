from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.decision import Decision
from app.models.approval import Approval
from app.models.notification import Notification
from app.services.email_service import send_email

router = APIRouter(
    prefix="/approvals",
    tags=["Approvals"]
)

MANAGER_ROLES = ["Manager", "Administrator"]


def require_manager(current_user: User):
    if current_user.role not in MANAGER_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Only Manager or Administrator can perform this action"
        )


@router.get("/reviewers")
def list_reviewers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_manager(current_user)

    reviewers = db.query(User).filter(
        User.role == "Reviewer"
    ).all()

    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "role": u.role
        }
        for u in reviewers
    ]


@router.post("/assign")
def assign_reviewer(
    decision_id: int,
    reviewer_id: int,
    level: int = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_manager(current_user)

    decision = db.query(Decision).filter(
        Decision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    if level > 1:
        prev_approval = (
            db.query(Approval)
            .filter(
                Approval.decision_id == decision_id,
                Approval.level == level - 1
            )
            .order_by(Approval.id.desc())
            .first()
        )

        if not prev_approval or prev_approval.status != "Approved":
            raise HTTPException(
                status_code=400,
                detail=f"Level {level - 1} must be approved before assigning Level {level}"
            )

    reviewer = db.query(User).filter(
        User.id == reviewer_id
    ).first()

    if not reviewer:
        raise HTTPException(
            status_code=404,
            detail="Reviewer not found"
        )

    approval = Approval(
        decision_id=decision_id,
        reviewer_id=reviewer_id,
        assigned_by=current_user.id,
        level=level,
        status="Pending"
    )

    db.add(approval)

    notification = Notification(
        user_id=reviewer_id,
        message=f"You've been assigned to review '{decision.title}' (Level {level})."
    )

    db.add(notification)

    # SMTP EMAIL
    send_email(
        reviewer.email,
        "Decision Review Assignment",
        f"""
Hello {reviewer.full_name},

You have been assigned to review the decision:

Title: {decision.title}
Level: {level}

Please login to Expert Decision Replay Platform and review it.

Thank You.
"""
    )

    db.commit()
    db.refresh(approval)

    return approval


@router.get("/my")
def my_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    approvals = (
        db.query(Approval)
        .filter(
            Approval.reviewer_id == current_user.id,
            Approval.status == "Pending"
        )
        .all()
    )

    result = []

    for a in approvals:
        result.append({
            "approval_id": a.id,
            "decision_id": a.decision_id,
            "decision_title": a.decision.title if a.decision else None,
            "level": a.level,
            "status": a.status,
        })

    return result


@router.put("/{approval_id}/decide")
def decide_approval(
    approval_id: int,
    status: str,
    remarks: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    approval = db.query(Approval).filter(
        Approval.id == approval_id
    ).first()

    if not approval:
        raise HTTPException(
            status_code=404,
            detail="Approval not found"
        )

    is_assigned_reviewer = (
        approval.reviewer_id == current_user.id
    )

    is_manager = (
        current_user.role in MANAGER_ROLES
    )

    if not (is_assigned_reviewer or is_manager):
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to act on this approval"
        )

    approval.status = status
    approval.remarks = remarks

    decision = db.query(Decision).filter(
        Decision.id == approval.decision_id
    ).first()

    if decision:
        decision.status = status

        notification = Notification(
            user_id=decision.created_by,
            message=f"Your decision '{decision.title}' has been {status.lower()} (Level {approval.level})."
        )

        db.add(notification)

        creator = db.query(User).filter(
            User.id == decision.created_by
        ).first()

        if creator:
            send_email(
                creator.email,
                f"Decision {status}",
                f"""
Hello {creator.full_name},

Your decision:

{decision.title}

has been {status}.

Remarks:
{remarks}

Thank You.
"""
            )

    db.commit()

    return {
        "message": f"Approval {status.lower()} successfully"
    }


@router.get("/")
def all_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_manager(current_user)

    approvals = db.query(Approval).all()

    result = []

    for a in approvals:
        result.append({
            "approval_id": a.id,
            "decision_id": a.decision_id,
            "decision_title": a.decision.title if a.decision else None,
            "reviewer_name": a.reviewer.full_name if a.reviewer else None,
            "level": a.level,
            "status": a.status,
            "remarks": a.remarks,
        })

    return result


@router.post("/{decision_id}")
def approve_decision(
    decision_id: int,
    status: str,
    remarks: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [
        "Reviewer",
        "Manager",
        "Administrator"
    ]:
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

    decision.status = status

    notification = Notification(
        user_id=decision.created_by,
        message=f"Your decision '{decision.title}' has been {status}."
    )

    db.add(notification)

    creator = db.query(User).filter(
        User.id == decision.created_by
    ).first()

    if creator:
        send_email(
            creator.email,
            f"Decision {status}",
            f"""
Hello {creator.full_name},

Your decision:

{decision.title}

has been {status}.

Remarks:
{remarks}

Thank You.
"""
        )

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
        .filter(
            Approval.decision_id == decision_id
        )
        .all()
    )

    return approvals