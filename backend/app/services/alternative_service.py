"""
services/alternative_service.py

Business logic for Alternative management.

Responsibilities

- Create alternatives
- Update alternatives
- Delete alternatives
- List alternatives for a decision
- Select the final alternative
"""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alternative import Alternative
from app.models.user import User

from app.repositories.alternative_repository import AlternativeRepository
from app.repositories.decision_repository import DecisionRepository

from app.schemas.alternative import (
    AlternativeCreate,
    AlternativeOut,
    AlternativeUpdate,
)

from app.utils.exceptions import (
    NotFoundException,
    PermissionDeniedException,
)


class AlternativeService:

    def __init__(
        self,
        db: AsyncSession,
    ) -> None:

        self.db = db

        self.alternatives = AlternativeRepository(db)
        self.decisions = DecisionRepository(db)

    # --------------------------------------------------
    # Queries
    # --------------------------------------------------

    async def list_alternatives(
        self,
        decision_id: uuid.UUID,
    ) -> list[AlternativeOut]:

        decision = await self.decisions.get_by_id(
            decision_id
        )

        if decision is None:
            raise NotFoundException(
                "Decision not found."
            )

        alternatives = await self.alternatives.list_by_decision(
            decision_id
        )

        return [
            AlternativeOut.model_validate(a)
            for a in alternatives
        ]

    async def get_alternative(
        self,
        alternative_id: uuid.UUID,
    ) -> AlternativeOut:

        alternative = await self.alternatives.get_by_id(
            alternative_id
        )

        if alternative is None:
            raise NotFoundException(
                "Alternative not found."
            )

        return AlternativeOut.model_validate(
            alternative
        )

    # --------------------------------------------------
    # Create
    # --------------------------------------------------

    async def create_alternative(
        self,
        decision_id: uuid.UUID,
        payload: AlternativeCreate,
        current_user: User,
    ) -> AlternativeOut:

        decision = await self.decisions.get_by_id(
            decision_id
        )

        if decision is None:
            raise NotFoundException(
                "Decision not found."
            )

        alternative = Alternative(
            decision_id=decision_id,
            title=payload.title,
            description=payload.description,
            pros=payload.pros,
            cons=payload.cons,
            cost_estimate=payload.cost_estimate,
            feasibility_score=payload.feasibility_score,
            risk_assessment=payload.risk_assessment,
            created_by_id=current_user.id,
        )

        self.alternatives.add(
            alternative
        )

        await self.db.commit()

        created = await self.alternatives.get_by_id(
            alternative.id
        )

        return AlternativeOut.model_validate(
            created
        )

    # --------------------------------------------------
    # Update
    # --------------------------------------------------

    async def update_alternative(
        self,
        alternative_id: uuid.UUID,
        payload: AlternativeUpdate,
        current_user: User,
    ) -> AlternativeOut:

        alternative = await self.alternatives.get_by_id(
            alternative_id
        )

        if alternative is None:
            raise NotFoundException(
                "Alternative not found."
            )

        if (
            current_user.id != alternative.created_by_id
            and current_user.role.name != "administrator"
        ):
            raise PermissionDeniedException(
                "You do not have permission to edit this alternative."
            )

        for field, value in payload.model_dump(
            exclude_unset=True
        ).items():

            setattr(
                alternative,
                field,
                value,
            )

        await self.db.commit()

        updated = await self.alternatives.get_by_id(
            alternative_id
        )

        return AlternativeOut.model_validate(
            updated
        )

    # --------------------------------------------------
    # Selection
    # --------------------------------------------------

    async def select_alternative(
        self,
        alternative_id: uuid.UUID,
    ) -> AlternativeOut:

        alternative = await self.alternatives.get_by_id(
            alternative_id
        )

        if alternative is None:
            raise NotFoundException(
                "Alternative not found."
            )

        alternatives = await self.alternatives.list_by_decision(
            alternative.decision_id
        )

        for item in alternatives:
            item.is_selected = (
                item.id == alternative.id
            )

        await self.db.commit()

        updated = await self.alternatives.get_by_id(
            alternative_id
        )

        return AlternativeOut.model_validate(
            updated
        )

    # --------------------------------------------------
    # Delete
    # --------------------------------------------------

    async def delete_alternative(
        self,
        alternative_id: uuid.UUID,
        current_user: User,
    ) -> None:

        alternative = await self.alternatives.get_by_id(
            alternative_id
        )

        if alternative is None:
            raise NotFoundException(
                "Alternative not found."
            )

        if (
            current_user.id != alternative.created_by_id
            and current_user.role.name != "administrator"
        ):
            raise PermissionDeniedException(
                "You do not have permission to delete this alternative."
            )

        await self.alternatives.soft_delete(
            alternative
        )

        await self.db.commit()
