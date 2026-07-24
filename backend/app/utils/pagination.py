# utils/pagination.py
"""
utils/pagination.py

Thin helper kept separate from schemas/common.py's PaginationParams so
routers/services can import bounds-checking logic without pulling in
the full Pydantic schema module. Currently a passthrough since
PaginationParams already enforces bounds at the schema level (ge/le on
page_size) — this exists as the single place to extend pagination
behavior (e.g. cursor-based pagination) without touching every router.
"""
from app.schemas.common import PaginationParams


def clamp_page_size(pagination: PaginationParams, max_page_size: int) -> PaginationParams:
    if pagination.page_size > max_page_size:
        return PaginationParams(page=pagination.page, page_size=max_page_size)
    return pagination

