# routers/users.py
"""
routers/users.py

/users CRUD + /users/me.

RBAC is declarative (`Depends(require_role(...))`) wherever a single
fixed role set gates a route. Where the rule is finer than that — "a
user may always read their own record, but reading someone else's
needs Manager/Administrator" — the check is pushed into the service
layer instead of being bolted onto the route as an if-statement.
"""
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.enums import RoleName
from app.models.user import User
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.user import (
    PasswordChange,
    RoleAssignRequest,
    UserCreate,
    UserOut,
    UserSelfUpdate,
    UserUpdate,
)
from app.services.user_service import UserService

router = APIRouter()


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(db)


@router.get(
    "/",
    response_model=PaginatedResponse[UserOut],
    dependencies=[Depends(require_role(RoleName.MANAGER, RoleName.ADMINISTRATOR))],
)
async def list_users(
    pagination: PaginationParams = Depends(),
    user_service: UserService = Depends(get_user_service),
) -> PaginatedResponse[UserOut]:
    return await user_service.list_users(pagination=pagination)


@router.post(
    "/",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(RoleName.ADMINISTRATOR))],
)
async def create_user(
    payload: UserCreate,
    user_service: UserService = Depends(get_user_service),
) -> UserOut:
    return await user_service.create_user(payload)


@router.get("/me", response_model=UserOut)
async def read_own_profile(
    current_user: User = Depends(get_current_user),
) -> UserOut:
    return UserOut.model_validate(current_user)


@router.patch("/me", response_model=UserOut)
async def update_own_profile(
    payload: UserSelfUpdate,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> UserOut:
    return await user_service.update_user(user_id=current_user.id, payload=payload, acting_user=current_user)


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_own_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> None:
    await user_service.change_password(user_id=current_user.id, payload=payload)


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> UserOut:
    return await user_service.get_user(user_id=user_id, acting_user=current_user)


@router.patch(
    "/{user_id}",
    response_model=UserOut,
    dependencies=[Depends(require_role(RoleName.ADMINISTRATOR))],
)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> UserOut:
    return await user_service.update_user(user_id=user_id, payload=payload, acting_user=current_user)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(RoleName.ADMINISTRATOR))],
)
async def deactivate_user(
    user_id: uuid.UUID,
    user_service: UserService = Depends(get_user_service),
) -> None:
    """Soft-deactivation (is_active=False) — never a physical DELETE."""
    await user_service.deactivate_user(user_id=user_id)


@router.patch(
    "/{user_id}/role",
    response_model=UserOut,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(RoleName.ADMINISTRATOR))],
)
async def change_user_role(
    user_id: uuid.UUID,
    payload: RoleAssignRequest,
    user_service: UserService = Depends(get_user_service),
) -> UserOut:
    return await user_service.change_role(user_id=user_id, role_id=payload.role_id)

