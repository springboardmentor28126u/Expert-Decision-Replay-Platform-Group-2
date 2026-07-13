# repositories/base_repository.py
"""
repositories/base_repository.py

Generic CRUD repository. Entity-specific repositories inherit from
this for the common operations and add their own query methods
(get_by_email, get_by_name, etc) on top.
"""
import uuid
from typing import Any, Generic, Optional, Sequence, Type, TypeVar, cast

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, db: AsyncSession, model: Type[ModelType]) -> None:
        self.db = db
        self.model = model

    def _base_query(self):
        """
        Filters out soft-deleted rows by default wherever the model has
        an `is_deleted` column. Models without SoftDeleteMixin (e.g.
        Approval, AuditLog) simply don't have the attribute, so the
        check is skipped for them.
        """
        query = select(self.model)
        model_any = cast(Any, self.model)
        if hasattr(model_any, "is_deleted"):
            query = query.where(model_any.is_deleted.is_(False))
        return query

    async def get_by_id(self, id_: uuid.UUID) -> Optional[ModelType]:
        model_any = cast(Any, self.model)
        result = await self.db.execute(self._base_query().where(model_any.id == id_))
        return result.scalar_one_or_none()

    async def list(self, offset: int = 0, limit: int = 20) -> Sequence[ModelType]:
        result = await self.db.execute(self._base_query().offset(offset).limit(limit))
        return result.scalars().all()

    async def count(self) -> int:
        model_any = cast(Any, self.model)
        query = select(func.count()).select_from(self.model)
        if hasattr(model_any, "is_deleted"):
            query = query.where(model_any.is_deleted.is_(False))
        result = await self.db.execute(query)
        return result.scalar_one()

    def add(self, instance: ModelType) -> ModelType:
        self.db.add(instance)
        return instance

    async def flush(self) -> None:
        """
        Flush only — commit boundaries belong to the service layer
        (see database.py's get_db docstring). Repositories never commit.
        """
        await self.db.flush()

    async def soft_delete(self, instance: ModelType) -> None:
        """No-op if the model has no SoftDeleteMixin — caller's responsibility to check."""
        from datetime import datetime, timezone

        instance_any = cast(Any, instance)
        instance_any.is_deleted = True
        instance_any.deleted_at = datetime.now(timezone.utc)
        await self.flush()
