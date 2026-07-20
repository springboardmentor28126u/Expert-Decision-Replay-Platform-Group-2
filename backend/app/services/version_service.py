"""Version service — decision version history retrieval."""

import logging
from typing import List

from sqlalchemy.orm import Session

from app.models.decision_history import DecisionHistory
from app.repositories.version_repository import VersionRepository

logger = logging.getLogger(__name__)


class VersionService:
    """Service handling version history retrieval."""

    def __init__(self, db: Session):
        self.version_repo = VersionRepository(db)

    def get_history(self, decision_id: int) -> List[DecisionHistory]:
        """Get all version history entries for a decision, newest first."""
        return self.version_repo.get_by_decision_id(decision_id)
