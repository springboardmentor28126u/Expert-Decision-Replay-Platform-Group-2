"""Files router — file upload, download, and deletion."""

from typing import List

from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, get_storage
from app.models.user import User
from app.schemas.file import FileResponse as FileResponseSchema
from app.services.file_service import FileService
from app.storage.base import StorageBackend

router = APIRouter(
    prefix="/api/decisions/{decision_id}/files",
    tags=["Files"],
)


@router.post("/", response_model=FileResponseSchema)
async def upload_file(
    decision_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
):
    """Upload a file attachment to a decision."""
    service = FileService(db, storage)
    return await service.upload_file(decision_id, file, current_user)


@router.get("/", response_model=List[FileResponseSchema])
def list_files(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all file attachments for a decision."""
    storage = get_storage()
    service = FileService(db, storage)
    return service.get_files(decision_id)


@router.get("/{file_id}/download")
def download_file(
    decision_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
):
    """Download a file attachment."""
    service = FileService(db, storage)
    attachment = service.get_file(file_id)
    file_path = service.get_file_path(file_id)
    return FileResponse(
        path=file_path,
        filename=attachment.filename,
        media_type=attachment.content_type,
    )


@router.delete("/{file_id}")
def delete_file(
    decision_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
):
    """Delete a file attachment."""
    service = FileService(db, storage)
    service.delete_file(file_id)
    return {"message": f"File {file_id} deleted successfully"}
