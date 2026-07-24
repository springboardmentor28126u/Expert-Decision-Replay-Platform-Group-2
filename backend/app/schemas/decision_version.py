"""
schemas/decision_version.py
"""

import uuid
from datetime import datetime
from typing import Optional

from app.schemas.common import ORMBase


class DecisionVersionOut(ORMBase):
    id: uuid.UUID

    decision_id: uuid.UUID

    version_number: int

    title: str

    problem_statement: str

    category: Optional[str] = None

    decision_rationale: Optional[str] = None

    status: str

    changed_by_id: Optional[uuid.UUID] = None

    created_at: datetime
