from pydantic import BaseModel
from datetime import datetime


class CommentCreate(BaseModel):
    comment: str


class CommentUpdate(BaseModel):
    comment: str


class CommentResponse(BaseModel):
    id: int
    decision_id: int
    user_id: int
    comment: str
    created_at: datetime
    user_name: str
    user_role: str

    class Config:
        from_attributes = True