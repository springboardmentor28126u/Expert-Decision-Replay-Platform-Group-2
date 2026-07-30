from pydantic import BaseModel
from datetime import datetime


class DiscussionBase(BaseModel):
    username: str
    message: str


class DiscussionCreate(DiscussionBase):
    decision_id: int


class DiscussionResponse(DiscussionBase):
    id: int
    decision_id: int
    created_at: datetime

    class Config:
        from_attributes = True