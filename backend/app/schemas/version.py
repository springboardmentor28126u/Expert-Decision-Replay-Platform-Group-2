from pydantic import BaseModel
from datetime import datetime


class VersionBase(BaseModel):
    action: str
    username: str
    decision_id: int


class VersionCreate(VersionBase):
    pass


class VersionResponse(VersionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True