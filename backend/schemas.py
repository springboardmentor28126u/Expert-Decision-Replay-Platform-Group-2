from pydantic import BaseModel, EmailStr
from datetime import datetime
from models import UserRole

# Data expected when a new user registers
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    
# Data expected when a user logs in
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Data sent back to the client (never includes password)
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Data sent back after successful login
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class RoleUpdate(BaseModel):
    role: UserRole

from models import DecisionStatus
from discussion import DiscussionMessageType

class DecisionCreate(BaseModel):
    title: str
    problem_statement: str
    category: str | None = None

class DecisionResponse(BaseModel):
    id: int
    title: str
    problem_statement: str
    category: str | None
    status: DecisionStatus
    created_by: int
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True

class DecisionStatusUpdate(BaseModel):
    status: DecisionStatus

class DiscussionCreate(BaseModel):
    decision_id: int
    message: str
    message_type: DiscussionMessageType = DiscussionMessageType.comment
    attachment_url: str | None = None


class DiscussionReplyCreate(BaseModel):
    parent_id: int
    message: str
    message_type: DiscussionMessageType = DiscussionMessageType.reply
    attachment_url: str | None = None


class DiscussionUpdate(BaseModel):
    message: str | None = None
    attachment_url: str | None = None


class DiscussionResponse(BaseModel):
    id: int
    decision_id: int
    user_id: int
    parent_id: int | None
    message: str
    message_type: DiscussionMessageType
    attachment_url: str | None
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


