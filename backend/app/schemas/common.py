"""
schemas/common.py

Shared, reusable schema building blocks so pagination and ORM-mode
config aren't redefined in every entity's schema file.
"""

from typing import Generic, List, TypeVar

from pydantic import BaseModel, ConfigDict, Field

DataT = TypeVar("DataT")


class ORMBase(BaseModel):
    """
    Base class for every "Out" (response) schema.

    `from_attributes=True` (the Pydantic v2 successor to `orm_mode`)
    lets these schemas be constructed directly from SQLAlchemy model
    instances, e.g. `UserOut.model_validate(user_orm_instance)`.
    """
    model_config = ConfigDict(from_attributes=True)


class PaginationParams(BaseModel):
    """
    Standard query-parameter shape for every paginated list endpoint.
    Bounds are enforced here once rather than repeated per-router, and
    are backed by config.py's DEFAULT_PAGE_SIZE / MAX_PAGE_SIZE.
    """
    page: int = Field(default=1, ge=1, description="1-indexed page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class PaginatedResponse(BaseModel, Generic[DataT]):
    """
    Generic envelope for any paginated list response:

        PaginatedResponse[UserOut](items=[...], total=142, page=1, page_size=20)
    """
    items: List[DataT]
    total: int
    page: int
    page_size: int

    @property
    def total_pages(self) -> int:
        if self.page_size == 0:
            return 0
        return (self.total + self.page_size - 1) // self.page_size

