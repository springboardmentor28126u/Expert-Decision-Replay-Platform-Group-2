"""Alternative service — alternative analysis CRUD."""

import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from app.exceptions.handlers import NotFoundException
from app.models.alternative import Alternative
from app.repositories.alternative_repository import AlternativeRepository
from app.schemas.alternative import AlternativeCreate, AlternativeUpdate

from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)


class AlternativeService:
    """Service handling alternative analysis business logic."""

    def __init__(self, db: Session):
        self.alt_repo = AlternativeRepository(db)
        self.audit_service = AuditService(db)

    def create_alternative(
        self, decision_id: int, data: AlternativeCreate, user_id: Optional[int] = None
    ) -> Alternative:
        """Create a new alternative for a decision."""
        alternative = Alternative(
            decision_id=decision_id,
            name=data.name,
            pros=data.pros,
            cons=data.cons,
            cost=data.cost,
            quality=data.quality,
            risk=data.risk,
            feasibility=data.feasibility,
        )
        alternative = self.alt_repo.create(alternative)
        logger.info(f"Alternative created: {alternative.id} for decision {decision_id}")

        self.audit_service.log_alternative_added(
            user_id=user_id,
            decision_id=decision_id,
            name=alternative.name,
        )
        return alternative

    def get_alternatives(self, decision_id: int) -> List[Alternative]:
        """Get all alternatives for a decision."""
        return self.alt_repo.get_by_decision_id(decision_id)

    def update_alternative(self, alt_id: int, data: AlternativeUpdate) -> Alternative:
        """Update an alternative."""
        alternative = self.alt_repo.get_by_id(alt_id)
        if not alternative:
            raise NotFoundException(f"Alternative with ID {alt_id} not found")

        if data.name is not None:
            alternative.name = data.name
        if data.pros is not None:
            alternative.pros = data.pros
        if data.cons is not None:
            alternative.cons = data.cons
        if data.cost is not None:
            alternative.cost = data.cost
        if data.quality is not None:
            alternative.quality = data.quality
        if data.risk is not None:
            alternative.risk = data.risk
        if data.feasibility is not None:
            alternative.feasibility = data.feasibility

        return self.alt_repo.update(alternative)

    def delete_alternative(self, alt_id: int) -> None:
        """Delete an alternative."""
        alternative = self.alt_repo.get_by_id(alt_id)
        if not alternative:
            raise NotFoundException(f"Alternative with ID {alt_id} not found")
        self.alt_repo.delete(alternative)
        logger.info(f"Alternative {alt_id} deleted")
