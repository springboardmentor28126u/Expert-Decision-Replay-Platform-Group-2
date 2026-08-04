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

import requests as http_requests
from fastapi.responses import StreamingResponse
import io

@router.get("/{filename}")
async def get_uploaded_file(filename: str, download: bool = False):
    """Serves an uploaded file by filename. Pass ?download=true to force download instead of viewing."""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        if download:
            return FileResponse(file_path, filename=filename, media_type="application/octet-stream")
        return FileResponse(file_path)

    try:
        b2_url = b2_service.get_b2_download_url(f"uploads/{filename}")

        if download:
            # Fetch the file ourselves and hand it to the browser directly
            file_response = http_requests.get(b2_url)
            file_response.raise_for_status()
            return StreamingResponse(
                io.BytesIO(file_response.content),
                media_type="application/octet-stream",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )

        return RedirectResponse(b2_url)
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found on server or Backblaze B2.")