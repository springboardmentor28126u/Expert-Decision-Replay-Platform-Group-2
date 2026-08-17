# schemas/task_routing.py
"""
schemas/task_routing.py
"""

import uuid
from typing import Literal, Optional

from pydantic import BaseModel, Field


class TaskRoutingRequest(BaseModel):
    """
    POST /api/v1/ai/task — a natural-language command, interpreted by
    the LLM into one of two supported structured actions.

    Two-phase by design: the first call (confirm=False, the default)
    only interprets + validates the command and returns a preview —
    nothing is mutated. The caller then re-submits the exact
    action/decision_id/reviewer_id the preview returned, with
    confirm=True, to actually execute it. See
    services/task_routing_service.py for why confirm doesn't re-invoke
    the LLM (determinism) and why every field is still re-validated
    server-side regardless of what the client sends (defense in depth
    — a client cannot skip interpretation by fabricating a confirm
    payload, because the same authorization/business rules run again
    at confirm time).
    """

    command: str = Field(min_length=3, max_length=500)
    confirm: bool = False

    # Only meaningful (and only trusted after re-validation) when
    # confirm=True — echoed back from a prior preview response.
    action: Optional[Literal["reassign_reviewer", "escalate"]] = None
    decision_id: Optional[uuid.UUID] = None
    reviewer_id: Optional[uuid.UUID] = None
    generated_by: Optional[Literal["gemini", "groq"]] = None


class TaskRoutingResponse(BaseModel):
    success: bool
    executed: bool
    action: Optional[Literal["reassign_reviewer", "escalate", "unsupported", "unclear"]] = None
    decision_id: Optional[uuid.UUID] = None
    decision_title: Optional[str] = None
    reviewer_id: Optional[uuid.UUID] = None
    reviewer_name: Optional[str] = None
    generated_by: Optional[Literal["gemini", "groq"]] = None
    message: str
