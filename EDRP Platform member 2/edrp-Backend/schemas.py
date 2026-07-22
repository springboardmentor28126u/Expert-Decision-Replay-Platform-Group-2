from pydantic import BaseModel, field_validator
from enum import Enum
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    team_id: int | None = None

    class Config:
        from_attributes = True

class TeamCreate(BaseModel):
    name: str
    manager_id: int | None = None


class TeamOut(BaseModel):
    id: int
    name: str
    manager_id: int | None

    class Config:
        from_attributes = True

# Decision Management Schemas
class DecisionCreate(BaseModel):
    title: str
    description: str | None = None
    status: str | None = "draft"
    owner_id: int

class DecisionOut(BaseModel):
    id: int
    title: str
    description: str | None
    status: str
    created_at: datetime
    updated_at: datetime | None
    owner_id: int

    class Config:
        from_attributes = True

class AlternativeCreate(BaseModel):
    description: str
    title: str | None = None
    pros: str | None = None
    cons: str | None = None
    score: int | None = None
    estimated_cost: float | None = None
    feasibility_score: int | None = None
    risk_score: int | None = None
    is_selected: bool | None = False

    @field_validator("feasibility_score")
    @classmethod
    def validate_feasibility(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("feasibility_score must be between 0 and 100")
        return v

    @field_validator("risk_score")
    @classmethod
    def validate_risk(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("risk_score must be between 0 and 100")
        return v

    @field_validator("estimated_cost")
    @classmethod
    def validate_cost(cls, v):
        if v is not None and v <= 0:
            raise ValueError("estimated_cost must be a positive value")
        return v

class AlternativeOut(BaseModel):
    id: int
    decision_id: int
    title: str | None
    description: str
    pros: str | None
    cons: str | None
    score: int | None
    estimated_cost: float | None
    feasibility_score: int | None
    risk_score: int | None
    is_selected: bool

    class Config:
        from_attributes = True

class AlternativeUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    pros: str | None = None
    cons: str | None = None
    score: int | None = None
    estimated_cost: float | None = None
    feasibility_score: int | None = None
    risk_score: int | None = None
    is_selected: bool | None = None

    @field_validator("feasibility_score")
    @classmethod
    def validate_feasibility(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("feasibility_score must be between 0 and 100")
        return v

    @field_validator("risk_score")
    @classmethod
    def validate_risk(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("risk_score must be between 0 and 100")
        return v

    @field_validator("estimated_cost")
    @classmethod
    def validate_cost(cls, v):
        if v is not None and v <= 0:
            raise ValueError("estimated_cost must be a positive value")
        return v

class KnowledgeCreate(BaseModel):
    decision_id: int
    content: str
    source: str | None = None

class KnowledgeOut(BaseModel):
    id: int
    decision_id: int
    content: str
    source: str | None
    added_at: datetime

    class Config:
        from_attributes = True

# Category Schemas
class CategoryCreate(BaseModel):
    name: str
    description: str | None = None

class CategoryOut(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime

    class Config:
        from_attributes = True

class CategoryAssign(BaseModel):
    category_id: int

    class Config:
        from_attributes = True

# Decision Status Schemas
class DecisionStatus(str, Enum):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    FINALIZED = "finalized"

class DecisionStatusUpdate(BaseModel):
    status: DecisionStatus

class DecisionVersionOut(BaseModel):
    id: int
    decision_id: int
    version_number: int
    title: str
    description: str | None
    status: str
    created_at: datetime
    updated_at: datetime | None
    updated_by: int

    class Config:
        from_attributes = True

class AttachmentOut(BaseModel):
    id: int
    decision_id: int
    file_name: str
    file_path: str
    file_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class DiscussionCreate(BaseModel):
    title: str

class DiscussionOut(BaseModel):
    id: int
    decision_id: int
    created_by: int
    title: str
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    message: str

class CommentOut(BaseModel):
    id: int
    discussion_id: int
    user_id: int
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

class MeetingNoteCreate(BaseModel):
    note: str

class MeetingNoteOut(BaseModel):
    id: int
    discussion_id: int
    note: str
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

class DecisionRationaleCreate(BaseModel):
    rationale: str

class DecisionRationaleOut(BaseModel):
    id: int
    decision_id: int
    rationale: str
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

class DiscussionAttachmentOut(BaseModel):
    id: int
    discussion_id: int
    filename: str
    filepath: str
    uploaded_by: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

# class UserOut(BaseModel):
#     id: int
#     email: str
#     full_name: str | None

#     class Config:
#         from_attributes = True