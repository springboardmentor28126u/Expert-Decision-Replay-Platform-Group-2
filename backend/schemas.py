from pydantic import BaseModel, EmailStr
from datetime import datetime
from models import UserRole, DecisionStatus, RiskLevel, FeasibilityLevel

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
    
class AlternativeCreate(BaseModel):
    decision_id: int
    title: str
    description: str | None = None
    pros: str | None = None
    cons: str | None = None
    cost: float | None = None
    risk_level: RiskLevel
    feasibility: FeasibilityLevel
    
class AlternativeResponse(BaseModel):
    id: int
    decision_id: int
    title: str
    description: str | None
    pros: str | None
    cons: str | None
    cost: float | None
    risk_level: RiskLevel
    feasibility: FeasibilityLevel
    created_at: datetime

    class Config:
        from_attributes = True
        
class AlternativeUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    pros: str | None = None
    cons: str | None = None
    cost: float | None = None
    risk_level: RiskLevel | None = None
    feasibility: FeasibilityLevel | None = None