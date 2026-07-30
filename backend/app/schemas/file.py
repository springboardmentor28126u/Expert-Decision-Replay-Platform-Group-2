from pydantic import BaseModel
from datetime import datetime


# -----------------------------
# File Upload Response Schema
# -----------------------------
class FileResponse(BaseModel):
    id: int
    decision_id: int
    filename: str
    filepath: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


# -----------------------------
# File Delete Response Schema
# -----------------------------
class FileMessage(BaseModel):
    message: str