# routers/teams.py
"""
routers/teams.py

/teams CRUD + member add/remove.
"""
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import require_role
from app.models.enums import RoleName
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.team import TeamCreate, TeamDetailOut, TeamMemberAssign, TeamOut, TeamUpdate
from app.services.team_service import TeamService

router = APIRouter()


def get_team_service(db: AsyncSession = Depends(get_db)) -> TeamService:
    return TeamService(db)


@router.get("/", response_model=PaginatedResponse[TeamOut])
async def list_teams(
    pagination: PaginationParams = Depends(),
    team_service: TeamService = Depends(get_team_service),
) -> PaginatedResponse[TeamOut]:
    return await team_service.list_teams(pagination=pagination)


@router.post(
    "/",
    response_model=TeamOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(RoleName.MANAGER, RoleName.ADMINISTRATOR))],
)
async def create_team(
    payload: TeamCreate,
    team_service: TeamService = Depends(get_team_service),
) -> TeamOut:
    return await team_service.create_team(payload)


@router.get("/{team_id}", response_model=TeamDetailOut)
async def get_team(
    team_id: uuid.UUID,
    team_service: TeamService = Depends(get_team_service),
) -> TeamDetailOut:
    return await team_service.get_team(team_id=team_id)


@router.patch(
    "/{team_id}",
    response_model=TeamOut,
    dependencies=[Depends(require_role(RoleName.MANAGER, RoleName.ADMINISTRATOR))],
)
async def update_team(
    team_id: uuid.UUID,
    payload: TeamUpdate,
    team_service: TeamService = Depends(get_team_service),
) -> TeamOut:
    return await team_service.update_team(team_id=team_id, payload=payload)


@router.delete(
    "/{team_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(RoleName.ADMINISTRATOR))],
)
async def delete_team(
    team_id: uuid.UUID,
    team_service: TeamService = Depends(get_team_service),
) -> None:
    """Soft-deletes the team (SoftDeleteMixin) — never a physical DELETE."""
    await team_service.deactivate_team(team_id=team_id)


@router.post(
    "/{team_id}/members",
    response_model=TeamDetailOut,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(RoleName.MANAGER, RoleName.ADMINISTRATOR))],
)
async def add_team_member(
    team_id: uuid.UUID,
    payload: TeamMemberAssign,
    team_service: TeamService = Depends(get_team_service),
) -> TeamDetailOut:
    return await team_service.add_member(team_id=team_id, user_id=payload.user_id)


@router.delete(
    "/{team_id}/members/{user_id}",
    response_model=TeamDetailOut,
    dependencies=[Depends(require_role(RoleName.MANAGER, RoleName.ADMINISTRATOR))],
)
async def remove_team_member(
    team_id: uuid.UUID,
    user_id: uuid.UUID,
    team_service: TeamService = Depends(get_team_service),
) -> TeamDetailOut:
    return await team_service.remove_member(team_id=team_id, user_id=user_id)

