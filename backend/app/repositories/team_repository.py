# repositories/team_repository.py
import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.team import Team
from app.repositories.base_repository import BaseRepository


class TeamRepository(BaseRepository[Team]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, Team)

    def _base_query(self):
        return super()._base_query().options(
            selectinload(Team.manager), selectinload(Team.members)
        )

    async def get_by_id(self, id_: uuid.UUID) -> Optional[Team]:
        result = await self.db.execute(self._base_query().where(Team.id == id_))
        return result.scalar_one_or_none()

