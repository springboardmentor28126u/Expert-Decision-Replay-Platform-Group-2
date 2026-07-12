import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from models import Attachment
from auth import get_current_user, get_db

router = APIRouter()

@router.get("/{attachment_id}")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
        
    if not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="Physical file not found on server")
        
    return FileResponse(
        path=attachment.file_path,
        filename=attachment.file_name,
        media_type=attachment.file_type
    )

@router.delete("/{attachment_id}", response_model=dict)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
        
    if os.path.exists(attachment.file_path):
        try:
            os.remove(attachment.file_path)
        except Exception:
            pass
            
    db.delete(attachment)
    db.commit()
    return {"detail": "Attachment deleted"}
