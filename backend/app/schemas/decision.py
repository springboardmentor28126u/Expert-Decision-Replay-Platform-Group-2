from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DecisionCreate(BaseModel):
    title: str
    description: str
    created_by: int
    category_id: Optional[int] = None

class DecisionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None

class DecisionStatusUpdate(BaseModel):
    status: str

class DecisionResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    category_id: Optional[int] = None
    created_by: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class AlternativeCreateForDecision(BaseModel):
    title: str
    description: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    cost: Optional[float] = None
    feasibility_score: Optional[int] = None
    risk_level: Optional[str] = None

class ReviewerCreateForDecision(BaseModel):
    reviewer_id: int
    deadline: Optional[datetime] = None
    approval_type: Optional[str] = None

class DecisionFullCreate(BaseModel):
    title: str
    description: str
    created_by: int
    category_id: Optional[int] = None
    priority_level: Optional[str] = None
    department: Optional[str] = None
    decision_date: Optional[datetime] = None
    tags: Optional[str] = None
    alternatives: List[AlternativeCreateForDecision] = []
    reviewers: List[ReviewerCreateForDecision] = []
    temp_file_ids: List[int] = []

class AttachmentResponse(BaseModel):
    id: int
    filename: str
    file_size: int
    uploaded_at: datetime
    uploaded_by: int

    model_config = {
        "from_attributes": True
    }

class CommentCreate(BaseModel):
    content: str
    user_id: int

class CommentResponse(BaseModel):
    id: int
    content: str
    user_id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class DiscussionThreadCreate(BaseModel):
    topic: str
    created_by: int

class DiscussionThreadResponse(BaseModel):
    id: int
    topic: str
    status: str
    created_by: int
    created_at: datetime
    comments: List[CommentResponse] = []

    model_config = {
        "from_attributes": True
    }

class MeetingNoteCreate(BaseModel):
    title: str
    notes: str
    meeting_date: Optional[datetime] = None
    created_by: int

class MeetingNoteResponse(BaseModel):
    id: int
    title: str
    notes: str
    meeting_date: Optional[datetime] = None
    created_by: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class DecisionFullResponse(DecisionResponse):
    alternatives: List[BaseModel] = []
    reviews: List[BaseModel] = []
    attachments: List[AttachmentResponse] = []
    threads: List[DiscussionThreadResponse] = []
    meeting_notes: List[MeetingNoteResponse] = []
