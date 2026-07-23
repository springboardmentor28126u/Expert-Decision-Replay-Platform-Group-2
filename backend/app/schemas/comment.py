from pydantic import BaseModel
from datetime import datetime

class CommentCreate(BaseModel):
    content: str

class CommentOut(BaseModel):
    id: int
    decision_id: int
    content: str
    posted_by: int
    posted_at: datetime

    class Config:
        from_attributes = True