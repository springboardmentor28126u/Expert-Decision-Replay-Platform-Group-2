"""
repositories/base_repository.py

Generic CRUD repository.

Provides common database operations shared by all repositories.
Entity-specific repositories inherit from this class and implement
their own query methods.

Repositories NEVER commit transactions.
Transaction boundaries belong to the service layer.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Generic, Optional, Sequence, Type, TypeVar, cast

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

from app.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(
        self,
        db: AsyncSession,
        model: Type[ModelType],
    ) -> None:
        self.db = db
        self.model = model

    def _base_query(self) -> Select:
        """
        Returns a SELECT query that automatically excludes
        soft-deleted rows whenever the model supports soft deletion.
        """

        query = select(self.model)

        model_any = cast(Any, self.model)

        if hasattr(model_any, "is_deleted"):
            query = query.where(model_any.is_deleted.is_(False))

        return query

    async def get_by_id(
        self,
        id_: uuid.UUID,
    ) -> Optional[ModelType]:
        """
        Retrieve an entity by primary key.
        """

        model_any = cast(Any, self.model)

        result = await self.db.execute(
            self._base_query().where(
                model_any.id == id_
            )
        )

        return result.scalar_one_or_none()

    async def list(
        self,
        offset: int = 0,
        limit: int = 20,
    ) -> Sequence[ModelType]:
        """
        Paginated list.
        """

        result = await self.db.execute(
            self._base_query()
            .offset(offset)
            .limit(limit)
        )

        return result.scalars().all()

    async def first(self) -> Optional[ModelType]:
        """
        Returns the first available record.
        """

        result = await self.db.execute(
            self._base_query().limit(1)
        )

        return result.scalar_one_or_none()

    async def count(self) -> int:
        """
        Count non-deleted rows.
        """

        model_any = cast(Any, self.model)

        query = select(func.count()).select_from(self.model)

        if hasattr(model_any, "is_deleted"):
            query = query.where(
                model_any.is_deleted.is_(False)
            )

        result = await self.db.execute(query)

        return result.scalar_one()

    def add(
        self,
        instance: ModelType,
    ) -> ModelType:
        """
        Stage an entity for insertion.
        """

        self.db.add(instance)
        return instance

    async def flush(self) -> None:
        """
        Flush pending SQL to the database.

        Repositories never commit. Commit boundaries belong
        to the service layer.
        """

        await self.db.flush()

    async def refresh(
        self,
        instance: ModelType,
    ) -> None:
        """
        Refresh an entity from the database.
        """

        await self.db.refresh(instance)

    async def soft_delete(
        self,
        instance: ModelType,
    ) -> None:
        """
        Soft delete an entity.

        Caller must ensure the model supports SoftDeleteMixin.
        """

        instance_any = cast(Any, instance)

        instance_any.is_deleted = True
        instance_any.deleted_at = datetime.now(timezone.utc)

        await self.flush()

    async def hard_delete(
        self,
        instance: ModelType,
    ) -> None:
        """
        Permanently remove an entity.
        """

        await self.db.delete(instance)
        await self.flush()
