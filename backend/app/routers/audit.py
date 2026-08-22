from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_manager
from app import crud, schemas

router = APIRouter(
    prefix="/audit",
    tags=["Audit Logs"]
)


# =====================================================
# GET ALL AUDIT LOGS
# Manager & Administrator
# =====================================================

@router.get(
    "/",
    response_model=list[schemas.AuditLogResponse]
)
def get_all_audit_logs(

    db: Session = Depends(get_db),

    current_user=Depends(require_manager)

):

    return crud.get_all_audit_logs(db)


# =====================================================
# GET MY AUDIT LOGS
# Logged-in User
# =====================================================

@router.get(
    "/my",
    response_model=list[schemas.AuditLogResponse]
)
def get_my_audit_logs(

    db: Session = Depends(get_db),

    current_user=Depends(require_manager)

):

    return crud.get_audit_logs_by_user(

        db,

        current_user.id

    )