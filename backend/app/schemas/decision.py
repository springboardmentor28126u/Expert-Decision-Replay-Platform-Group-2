from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime

# Category Schemas
class CategoryBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = Field(None)

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Alternative Schemas
class AlternativeBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    cost_estimate: float = Field(0.0, ge=0)
    feasibility_analysis: Optional[str] = None
    risk_assessment: Optional[str] = None
    is_chosen: bool = False

class AlternativeCreate(AlternativeBase):
    pass

class AlternativeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    cost_estimate: Optional[float] = None
    feasibility_analysis: Optional[str] = None
    risk_assessment: Optional[str] = None
    is_chosen: Optional[bool] = None

class AlternativeOut(AlternativeBase):
    id: UUID
    decision_id: UUID
    model_config = ConfigDict(from_attributes=True)

# Attachment Schemas
class AttachmentBase(BaseModel):
    file_name: str
    file_path: str
    file_type: Optional[str] = None

class AttachmentOut(AttachmentBase):
    id: UUID
    decision_id: Optional[UUID] = None
    discussion_id: Optional[UUID] = None
    uploaded_by: UUID
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)

# User Reference (Mini) to break circular imports in nested schemas
class UserMinOut(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: str
    model_config = ConfigDict(from_attributes=True)

# Discussion Schemas
class DiscussionBase(BaseModel):
    content: str
    meeting_notes: Optional[str] = None
    decision_rationale: Optional[str] = None

class DiscussionCreate(DiscussionBase):
    parent_id: Optional[UUID] = None

class DiscussionOut(DiscussionBase):
    id: UUID
    decision_id: UUID
    user_id: UUID
    parent_id: Optional[UUID] = None
    created_at: datetime
    user: UserMinOut
    model_config = ConfigDict(from_attributes=True)

# Decision Version Schemas
class DecisionVersionOut(BaseModel):
    id: UUID
    decision_id: UUID
    title: str
    problem_statement: str
    evaluation_criteria: str
    status: str
    category_id: int
    version: int
    updated_by: UUID
    updated_at: datetime
    editor: UserMinOut
    model_config = ConfigDict(from_attributes=True)

# Decision Schemas
class DecisionBase(BaseModel):
    title: str = Field(..., max_length=255)
    problem_statement: str
    evaluation_criteria: str
    category_id: int
    team_id: Optional[UUID] = None

class DecisionCreate(DecisionBase):
    alternatives: List[AlternativeCreate] = []

class DecisionUpdate(BaseModel):
    title: Optional[str] = None
    problem_statement: Optional[str] = None
    evaluation_criteria: Optional[str] = None
    status: Optional[str] = None
    category_id: Optional[int] = None
    team_id: Optional[UUID] = None

class DecisionOut(DecisionBase):
    id: UUID
    status: str
    creator_id: UUID
    version: int
    created_at: datetime
    updated_at: datetime
    creator: UserMinOut
    category: CategoryOut
    model_config = ConfigDict(from_attributes=True)

class DecisionDetailOut(DecisionOut):
    alternatives: List[AlternativeOut] = []
    discussions: List[DiscussionOut] = []
    attachments: List[AttachmentOut] = []
    versions: List[DecisionVersionOut] = []
    approvals: List["ApprovalOut"] = []
    model_config = ConfigDict(from_attributes=True)

# Approval Schemas
class ApprovalCreate(BaseModel):
    reviewer_id: UUID
    stage: int = 1

class ApprovalAction(BaseModel):
    status: str = Field(..., description="approved or rejected")
    comments: Optional[str] = None

class ApprovalOut(BaseModel):
    id: UUID
    decision_id: UUID
    reviewer_id: UUID
    stage: int
    status: str
    comments: Optional[str]
    assigned_at: datetime
    actioned_at: Optional[datetime]
    reviewer: UserMinOut
    model_config = ConfigDict(from_attributes=True)

# Notification Schemas
class NotificationOut(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    message: str
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Audit Log Schemas
class AuditLogOut(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    action: str
    entity_name: Optional[str]
    entity_id: Optional[str]
    old_values: Optional[str]
    new_values: Optional[str]
    ip_address: Optional[str]
    timestamp: datetime
    user: Optional[UserMinOut] = None
    model_config = ConfigDict(from_attributes=True)

