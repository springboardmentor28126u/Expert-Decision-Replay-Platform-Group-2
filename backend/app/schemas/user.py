from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Team Schemas
class TeamBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = Field(None, max_length=1000)

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    manager_id: Optional[UUID] = None

class TeamOut(TeamBase):
    id: UUID
    manager_id: Optional[UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., max_length=255)
    role: str = Field("employee", description="Roles: employee, reviewer, manager, administrator")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    team_id: Optional[UUID] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    team_id: Optional[UUID] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: UUID
    team_id: Optional[UUID] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Deep/Nested Outputs to break circular references
class UserOutWithTeam(UserOut):
    team: Optional[TeamOut] = None

class TeamOutWithMembers(TeamOut):
    members: List[UserOut] = []
