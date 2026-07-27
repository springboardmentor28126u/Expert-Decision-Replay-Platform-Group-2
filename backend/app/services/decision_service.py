"""
services/decision_service.py

Business logic for Decision management.

Responsibilities:

- Create decisions
- Retrieve decisions
- Search decisions
- Update decisions
- Change workflow status
- Soft delete decisions
- Maintain immutable version history
"""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.decision import Decision
from app.models.enums import DecisionStatus
from app.models.user import User

from app.repositories.decision_repository import DecisionRepository
from app.repositories.decision_version_repository import (
    DecisionVersionRepository,
)

from app.schemas.common import (
    PaginatedResponse,
    PaginationParams,
)

from app.schemas.decision import (
    DecisionCreate,
    DecisionOut,
    DecisionStatusUpdate,
    DecisionUpdate,
)

from app.schemas.decision_version import (
    DecisionVersionOut,
)

from app.utils.exceptions import (
    NotFoundException,
    PermissionDeniedException,
)


class DecisionService:

    def __init__(
        self,
        db: AsyncSession,
    ) -> None:

        self.db = db

        self.decisions = DecisionRepository(db)
        self.versions = DecisionVersionRepository(db)

    # --------------------------------------------------
    # Queries
    # --------------------------------------------------

    async def list_decisions(
        self,
        pagination: PaginationParams,
    ) -> PaginatedResponse[DecisionOut]:

        items = await self.decisions.list_paginated(
            offset=pagination.offset,
            limit=pagination.page_size,
        )

        total = await self.decisions.count()

        return PaginatedResponse[DecisionOut](
            items=[
                DecisionOut.model_validate(d)
                for d in items
            ],
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )

    async def get_decision(
        self,
        decision_id: uuid.UUID,
    ) -> DecisionOut:

        decision = await self.decisions.get_by_id(decision_id)

        if decision is None:
            raise NotFoundException("Decision not found.")

        return DecisionOut.model_validate(decision)

    async def search(
        self,
        keyword: str,
        pagination: PaginationParams,
    ) -> PaginatedResponse[DecisionOut]:

        items = await self.decisions.search(
            keyword=keyword,
            offset=pagination.offset,
            limit=pagination.page_size,
        )

        total = len(items)

        return PaginatedResponse[DecisionOut](
            items=[
                DecisionOut.model_validate(d)
                for d in items
            ],
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )

    # --------------------------------------------------
    # Create
    # --------------------------------------------------

    async def create_decision(
        self,
        payload: DecisionCreate,
        current_user: User,
    ) -> DecisionOut:

        decision = Decision(
            title=payload.title,
            problem_statement=payload.problem_statement,
            category=payload.category,
            created_by_id=current_user.id,
            team_id=payload.team_id,
        )

        self.decisions.add(decision)

        await self.db.commit()

        created = await self.decisions.get_by_id(
            decision.id
        )

        return DecisionOut.model_validate(created)

    # --------------------------------------------------
    # Update
    # --------------------------------------------------

    async def update_decision(
        self,
        decision_id: uuid.UUID,
        payload: DecisionUpdate,
        current_user: User,
    ) -> DecisionOut:

        decision = await self.decisions.get_by_id(
            decision_id
        )

        if decision is None:
            raise NotFoundException("Decision not found.")

        if (
            current_user.id != decision.created_by_id
            and current_user.role.name != "administrator"
        ):
            raise PermissionDeniedException(
                "You do not have permission to edit this decision."
            )

        await self.versions.create_snapshot(
            decision=decision,
            changed_by_id=current_user.id,
        )

        for field, value in payload.model_dump(
            exclude_unset=True
        ).items():

            setattr(
                decision,
                field,
                value,
            )

        decision.version += 1

        await self.db.commit()

        updated = await self.decisions.get_by_id(
            decision_id
        )

        return DecisionOut.model_validate(updated)

    # --------------------------------------------------
    # Workflow
    # --------------------------------------------------

    async def update_status(
        self,
        decision_id: uuid.UUID,
        payload: DecisionStatusUpdate,
        current_user: User,
    ) -> DecisionOut:

        decision = await self.decisions.get_by_id(
            decision_id
        )

        if decision is None:
            raise NotFoundException(
                "Decision not found."
            )

        await self.versions.create_snapshot(
            decision=decision,
            changed_by_id=current_user.id,
        )

        decision.status = payload.status
        decision.version += 1

        await self.db.commit()

        updated = await self.decisions.get_by_id(
            decision_id
        )

        return DecisionOut.model_validate(updated)

    # --------------------------------------------------
    # Versions
    # --------------------------------------------------

    async def get_versions(
        self,
        decision_id: uuid.UUID,
    ) -> list[DecisionVersionOut]:

        decision = await self.decisions.get_by_id(
            decision_id
        )

        if decision is None:
            raise NotFoundException(
                "Decision not found."
            )

        versions = await self.versions.get_versions(
            decision_id
        )

        return [
            DecisionVersionOut.model_validate(v)
            for v in versions
        ]

    # --------------------------------------------------
    # Delete
    # --------------------------------------------------

    async def delete_decision(
        self,
        decision_id: uuid.UUID,
        current_user: User,
    ) -> None:

        decision = await self.decisions.get_by_id(
            decision_id
        )

        if decision is None:
            raise NotFoundException(
                "Decision not found."
            )

        if (
            current_user.id != decision.created_by_id
            and current_user.role.name != "administrator"
        ):
            raise PermissionDeniedException(
                "You do not have permission to delete this decision."
            )

        await self.decisions.soft_delete(
            decision
        )

        await self.db.commit()
