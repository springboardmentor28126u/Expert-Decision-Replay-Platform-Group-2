import os
import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app import crud, schemas


router = APIRouter(
    prefix="/attachments",
    tags=["Attachments"]
)


# =====================================================
# UPLOAD DIRECTORY
# =====================================================

UPLOAD_DIR = os.path.join(
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(__file__)
        )
    ),
    "uploads"
)

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


# =====================================================
# ALLOWED FILE TYPES
# =====================================================

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".png",
    ".jpg",
    ".jpeg"
}

MAX_FILE_SIZE = 10 * 1024 * 1024


# =====================================================
# UPLOAD FILE
# =====================================================

@router.post(
    "/upload",
    response_model=schemas.AttachmentResponse
)
async def upload_file(
    decision_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # Check decision
    decision = crud.get_decision_by_id(
        db,
        decision_id
    )

    if not decision:

        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    # Check extension
    original_name = file.filename or "file"

    extension = os.path.splitext(
        original_name
    )[1].lower()

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail="File type is not allowed."
        )

    # Read file
    content = await file.read()

    # Check size
    if len(content) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=400,
            detail="File size must not exceed 10 MB."
        )

    # Generate safe unique filename
    stored_name = (
        f"{uuid.uuid4().hex}"
        f"{extension}"
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        stored_name
    )

    # Save physical file
    with open(
        file_path,
        "wb"
    ) as buffer:

        buffer.write(content)

    # Save database record
    attachment = crud.create_attachment(
        db=db,
        decision_id=decision_id,
        uploaded_by=current_user.id,
        file_name=original_name,
        file_path=file_path,
        file_type=file.content_type,
        file_size=len(content)
    )

    # Existing notification system
    crud.create_notification(
        db=db,
        user_id=current_user.id,
        title="File Uploaded",
        message=(
            f"File '{original_name}' "
            f"was uploaded successfully "
            f"to decision '{decision.title}'."
        )
    )
    return attachment


# =====================================================
# GET DECISION ATTACHMENTS
# =====================================================

@router.get(
    "/decision/{decision_id}",
    response_model=list[schemas.AttachmentResponse]
)
def get_decision_attachments(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    decision = crud.get_decision_by_id(
        db,
        decision_id
    )

    if not decision:

        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    return crud.get_attachments_by_decision(
        db,
        decision_id
    )


# =====================================================
# DOWNLOAD ATTACHMENT
# =====================================================

@router.get(
    "/{attachment_id}/download"
)
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    attachment = crud.get_attachment_by_id(
        db,
        attachment_id
    )

    if not attachment:

        raise HTTPException(
            status_code=404,
            detail="Attachment not found"
        )

    if not os.path.exists(
        attachment.file_path
    ):

        raise HTTPException(
            status_code=404,
            detail="Physical file not found"
        )

    return FileResponse(
        path=attachment.file_path,
        filename=attachment.file_name,
        media_type=attachment.file_type
        or "application/octet-stream"
    )


# =====================================================
# DELETE ATTACHMENT
# =====================================================

@router.delete(
    "/{attachment_id}"
)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    attachment = crud.get_attachment_by_id(
        db,
        attachment_id
    )

    if not attachment:

        raise HTTPException(
            status_code=404,
            detail="Attachment not found"
        )

    # Only uploader or admin can delete
    if (
        attachment.uploaded_by
        != current_user.id
        and current_user.role
        != "Administrator"
    ):

        raise HTTPException(
            status_code=403,
            detail="You are not allowed to delete this file."
        )

    file_path = attachment.file_path

    crud.delete_attachment(
        db,
        attachment_id
    )

    # Delete physical file
    if os.path.exists(file_path):

        os.remove(file_path)

    return {
        "message": "Attachment deleted successfully"
    }