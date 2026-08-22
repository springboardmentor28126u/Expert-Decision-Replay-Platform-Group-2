from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


# ======================================================
# USER CREATE
# ======================================================

class UserCreate(BaseModel):

    employee_id: str

    full_name: str

    email: EmailStr

    phone: Optional[str] = None

    password: str

    role: str

    department: Optional[str] = None

    security_question: str

    security_answer: str


# ======================================================
# ADMIN CREATE USER
# ======================================================

class AdminUserCreate(BaseModel):

    employee_id: str

    full_name: str

    email: EmailStr

    phone: Optional[str] = None

    password: str

    role: str

    department: Optional[str] = None

    security_question: str

    security_answer: str

    is_active: bool = True


# ======================================================
# USER RESPONSE
# ======================================================

class UserResponse(BaseModel):

    id: int

    employee_id: str

    full_name: str

    email: EmailStr

    phone: Optional[str] = None

    role: str

    department: Optional[str] = None

    is_active: bool

    created_at: datetime

    class Config:
        from_attributes = True


# ======================================================
# USER UPDATE
# ======================================================

class UserUpdate(BaseModel):

    employee_id: Optional[str] = None

    full_name: Optional[str] = None

    email: Optional[EmailStr] = None

    phone: Optional[str] = None

    department: Optional[str] = None

    role: Optional[str] = None

    is_active: Optional[bool] = None


# ======================================================
# PROFILE UPDATE
# ======================================================

class ProfileUpdate(BaseModel):

    full_name: Optional[str] = None

    phone: Optional[str] = None

    department: Optional[str] = None


# ======================================================
# CHANGE PASSWORD
# ======================================================

class ChangePassword(BaseModel):

    current_password: str

    new_password: str


# ======================================================
# LOGIN
# ======================================================

class UserLogin(BaseModel):

    email: EmailStr

    password: str


class Token(BaseModel):

    access_token: str

    token_type: str


# ======================================================
# FORGOT PASSWORD
# ======================================================

class ForgotPassword(BaseModel):

    employee_id: str

    email: EmailStr

    security_question: str

    security_answer: str


# ======================================================
# RESET PASSWORD
# ======================================================

class ResetPassword(BaseModel):

    employee_id: str

    email: EmailStr

    new_password: str
    # ======================================================
# DECISION SCHEMAS
# ======================================================

class DecisionCreate(BaseModel):

    title: str

    problem_statement: str

    category: str

    department: str

    priority: str


class DecisionUpdate(BaseModel):

    title: Optional[str] = None

    problem_statement: Optional[str] = None

    category: Optional[str] = None

    department: Optional[str] = None

    priority: Optional[str] = None

    status: Optional[str] = None


class DecisionResponse(BaseModel):

    id: int

    title: str

    problem_statement: str

    category: str

    department: str

    priority: str

    status: str

    created_by: int

    owner_name: str

    created_at: datetime

    updated_at: datetime

    class Config:
        from_attributes = True
# ======================================================
# APPROVAL SCHEMAS
# ======================================================

class ApprovalCreate(BaseModel):
    decision_id: int
    comments: Optional[str] = None
    due_date: Optional[datetime] = None

class ApprovalUpdate(BaseModel):

    status: str

    comments: Optional[str] = None


class ApprovalResponse(BaseModel):
    id: int
    decision_id: int
    approver_id: int
    status: str
    comments: Optional[str] = None
    approved_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    escalated: bool
    escalated_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
# ======================================================
# DISCUSSION SCHEMAS
# ======================================================

class DiscussionCreate(BaseModel):

    decision_id: int

    comment: str


class DiscussionUpdate(BaseModel):

    comment: str


class DiscussionResponse(BaseModel):

    id: int

    decision_id: int

    user_id: int

    comment: str

    created_at: datetime

    class Config:
        from_attributes = True
        # ======================================================
# KNOWLEDGE REPOSITORY SCHEMAS
# ======================================================

class KnowledgeCreate(BaseModel):

    title: str

    content: str

    category: str

    tags: Optional[str] = None


class KnowledgeUpdate(BaseModel):

    title: Optional[str] = None

    content: Optional[str] = None

    category: Optional[str] = None

    tags: Optional[str] = None


class KnowledgeResponse(BaseModel):

    id: int

    title: str

    content: str

    category: str

    tags: Optional[str] = None

    created_by: int

    created_at: datetime

    updated_at: datetime

    class Config:
        from_attributes = True
# =====================================================
# ALTERNATIVE ANALYSIS SCHEMAS
# =====================================================

class AlternativeBase(BaseModel):
    decision_id: int
    alternative_name: str
    description: str
    advantages: Optional[str] = None
    disadvantages: Optional[str] = None
    estimated_cost: Optional[str] = None
    risk_level: str = "Medium"
    score: int = 0


class AlternativeCreate(AlternativeBase):
    pass


class AlternativeUpdate(BaseModel):
    decision_id: Optional[int] = None
    alternative_name: Optional[str] = None
    description: Optional[str] = None
    advantages: Optional[str] = None
    disadvantages: Optional[str] = None
    estimated_cost: Optional[str] = None
    risk_level: Optional[str] = None
    score: Optional[int] = None


class AlternativeResponse(AlternativeBase):
    id: int

    class Config:
        from_attributes = True
# =====================================================
# AUDIT LOG SCHEMAS
# =====================================================

from datetime import datetime
from pydantic import BaseModel


class AuditLogBase(BaseModel):
    module: str
    action: str
    description: str
    entity_id: int | None = None


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogResponse(AuditLogBase):
    id: int
    user_id: int
    username: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True
class VersionCreate(BaseModel):
    decision_id: int
    change_summary: str


class VersionResponse(BaseModel):

    id: int

    decision_id: int

    version_number: int

    changed_by: int

    changed_by_name: str

    change_summary: str

    created_at: datetime

    class Config:
        from_attributes = True
# =====================================================
# NOTIFICATION SCHEMAS
# =====================================================

class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
    # =====================================================
# ATTACHMENT / FILE SCHEMAS
# =====================================================

class AttachmentResponse(BaseModel):

    id: int

    decision_id: int

    uploaded_by: int

    file_name: str

    file_path: str

    file_type: Optional[str] = None

    file_size: Optional[int] = None

    created_at: datetime

    class Config:
        from_attributes = True