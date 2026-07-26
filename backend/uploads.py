import os
import uuid
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
import b2_service

router = APIRouter(prefix="/api/uploads", tags=["Uploads"])
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".pdf", ".txt", ".docx"}
MAX_FILE_SIZE = 5 * 1024 * 1024  

@router.post("")
async def upload_file(file: UploadFile = File(...)):
    """Uploads a file and returns its access URL."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 5 MB limit."
        )
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    
    # Upload to Backblaze B2
    try:
        b2_service.upload_to_b2(contents, f"uploads/{unique_filename}", file.content_type)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file to Backblaze B2: {str(e)}"
        )
        
    file_url = f"/api/uploads/{unique_filename}"
    return {
        "filename": file.filename,
        "saved_as": unique_filename,
        "file_url": file_url
    }

@router.get("/{filename}")
async def get_uploaded_file(filename: str):
    """Serves an uploaded file by filename."""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    
    # If not found locally, redirect to Backblaze B2
    try:
        b2_url = b2_service.get_b2_download_url(f"uploads/{filename}")
        return RedirectResponse(b2_url)
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found on server or Backblaze B2.")