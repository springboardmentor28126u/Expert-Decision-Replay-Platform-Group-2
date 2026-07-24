# services/team_service.py
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team import Team
from app.repositories.team_repository import TeamRepository
from app.repositories.user_repository import UserRepository
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.team import TeamCreate, TeamDetailOut, TeamOut, TeamUpdate
from app.utils.exceptions import NotFoundException


class TeamService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.teams = TeamRepository(db)
        self.users = UserRepository(db)

    async def list_teams(self, pagination: PaginationParams) -> PaginatedResponse[TeamOut]:
        items = await self.teams.list(offset=pagination.offset, limit=pagination.page_size)
        total = await self.teams.count()
        return PaginatedResponse[TeamOut](
            items=[TeamOut.model_validate(t) for t in items],
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )

    async def create_team(self, payload: TeamCreate) -> TeamOut:
        team = Team(name=payload.name, description=payload.description, manager_id=payload.manager_id)
        self.teams.add(team)
        await self.db.commit()
        created = await self.teams.get_by_id(team.id)
        return TeamOut.model_validate(created)

    async def get_team(self, team_id: uuid.UUID) -> TeamDetailOut:
        team = await self.teams.get_by_id(team_id)
        if team is None:
            raise NotFoundException("Team not found.")
        return TeamDetailOut.model_validate(team)

    async def update_team(self, team_id: uuid.UUID, payload: TeamUpdate) -> TeamOut:
        team = await self.teams.get_by_id(team_id)
        if team is None:
            raise NotFoundException("Team not found.")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(team, field, value)
        await self.db.commit()
        refreshed = await self.teams.get_by_id(team_id)
        return TeamOut.model_validate(refreshed)

    async def deactivate_team(self, team_id: uuid.UUID) -> None:
        team = await self.teams.get_by_id(team_id)
        if team is None:
            raise NotFoundException("Team not found.")
        await self.teams.soft_delete(team)
        await self.db.commit()

    async def add_member(self, team_id: uuid.UUID, user_id: uuid.UUID) -> TeamDetailOut:
        team = await self.teams.get_by_id(team_id)
        if team is None:
            raise NotFoundException("Team not found.")
        user = await self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundException("User not found.")
        user.team_id = team_id
        await self.db.commit()
        refreshed = await self.teams.get_by_id(team_id)
        return TeamDetailOut.model_validate(refreshed)

    async def remove_member(self, team_id: uuid.UUID, user_id: uuid.UUID) -> TeamDetailOut:
        user = await self.users.get_by_id(user_id)
        if user is None or user.team_id != team_id:
            raise NotFoundException("User is not a member of this team.")
        user.team_id = None
        await self.db.commit()
        refreshed = await self.teams.get_by_id(team_id)
        return TeamDetailOut.model_validate(refreshed)

