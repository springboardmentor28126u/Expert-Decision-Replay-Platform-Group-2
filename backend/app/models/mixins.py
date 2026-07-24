"""
models/mixins.py

Reusable column mixins applied across every entity in the platform.

Every table needs the same three things:
  1. A UUID primary key (avoids ID enumeration; future-proofs against
     multi-region/multi-tenant sharding).
  2. created_at / updated_at audit timestamps.
  3. Soft-delete support — this is a compliance/audit-driven platform,
     decision history must never physically disappear.

Combined via multiple inheritance in each model, e.g.:

    class User(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
        __tablename__ = "users"
        ...
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class UUIDPrimaryKeyMixin:
    """Adds a UUID v4 primary key column named `id`."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),  # requires the pgcrypto extension
    )


class TimestampMixin:
    """Adds created_at / updated_at, timezone-aware and DB-managed."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SoftDeleteMixin:
    """
    Adds soft-delete support.

    Rows on audited entities are never physically DELETEd; `is_deleted`
    is flipped and `deleted_at` recorded instead. Repository queries
    must filter `is_deleted = False` by default (enforced in
    services/base_service.py / repository-style query helpers).
    """

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

