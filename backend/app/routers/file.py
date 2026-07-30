import os
import shutil

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.file import File as FileModel
from app.schemas.file import FileResponse, FileMessage
from app.crud.file import (
    create_file_record,
    get_files_by_decision,
    get_file_by_id,
    delete_file,
)

router = APIRouter(
    prefix="/files",
    tags=["File Uploads"]
)

UPLOAD_FOLDER = "app/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ---------------------------------
# Get ALL uploaded files (Repository)
# ---------------------------------
@router.get(
    "/all",
    response_model=list[FileResponse]
)
def get_all_files(db: Session = Depends(get_db)):
    return db.query(FileModel).all()


# ---------------------------------
# Upload File
# ---------------------------------
@router.post(
    "/upload/{decision_id}",
    response_model=FileResponse
)
def upload_file(
    decision_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db_file = create_file_record(
        db=db,
        decision_id=decision_id,
        filename=file.filename,
        filepath=file_path
    )

    return db_file


# ---------------------------------
# Get Files by Decision
# ---------------------------------
@router.get(
    "/decision/{decision_id}",
    response_model=list[FileResponse]
)
def get_files_of_decision(
    decision_id: int,
    db: Session = Depends(get_db)
):

    return get_files_by_decision(
        db,
        decision_id
    )


# ---------------------------------
# Delete File
# ---------------------------------
@router.delete(
    "/{file_id}",
    response_model=FileMessage
)
def remove_file(
    file_id: int,
    db: Session = Depends(get_db)
):

    db_file = get_file_by_id(
        db,
        file_id
    )

    if not db_file:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    if os.path.exists(db_file.filepath):
        os.remove(db_file.filepath)

    delete_file(
        db,
        db_file
    )

    return {
        "message": "File deleted successfully"
    }
    