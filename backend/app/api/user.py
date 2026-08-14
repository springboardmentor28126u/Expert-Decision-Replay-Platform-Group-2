from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

ALLOWED_ROLES = ["Employee", "Reviewer", "Manager", "Administrator"]


def require_admin(current_user: User):
    if current_user.role != "Administrator":
        raise HTTPException(
            status_code=403,
            detail="Only Administrator can perform this action"
        )


# ---- List all users ----
@router.get("/")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
        }
        for u in users
    ]


# ---- Update a user's role ----
@router.put("/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail=f"Role must be one of {ALLOWED_ROLES}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role
    db.commit()
    db.refresh(user)

    return {"message": f"{user.full_name}'s role updated to {role}"}

@router.put("/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.is_active = False

    db.commit()

    return {
        "message": f"{user.full_name} deactivated successfully"
    }


@router.put("/{user_id}/activate")
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.is_active = True

    db.commit()

    return {
        "message": f"{user.full_name} activated successfully"
    }

@router.put("/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.is_active = not user.is_active

    db.commit()
    db.refresh(user)

    return {
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully",
        "is_active": user.is_active
    }