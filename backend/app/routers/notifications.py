from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app import crud, schemas
from app.email_service import send_email

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# ==========================================
# Get My Notifications
# ==========================================

@router.get(
    "/",
    response_model=list[schemas.NotificationResponse]
)
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.get_notifications(
        db,
        current_user.id
    )


# ==========================================
# Create Notification
# ==========================================

@router.post(
    "/",
    response_model=schemas.NotificationResponse
)
def create_notification(
    notification: schemas.NotificationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.create_notification(
        db,
        notification.user_id,
        notification.title,
        notification.message
    )


# ==========================================
# Mark Notification Read
# ==========================================

@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    notification = crud.mark_notification_read(
        db,
        notification_id,
        current_user.id
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    return {
        "message": "Notification marked as read"
    }


# ==========================================
# Delete Notification
# ==========================================

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    notification = crud.delete_notification(
        db,
        notification_id,
        current_user.id
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    return {
        "message": "Notification deleted"
    }
@router.post("/test-email")
def test_email(
    email: str,
    current_user=Depends(get_current_user)
):

    success = send_email(
        to_email=email,
        subject="EDRP Email Test",
        body=(
            "This is a test email from "
            "Expert Decision Replay Platform."
        )
    )

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Email could not be sent."
        )

    return {
        "message": "Test email sent successfully."
    }