"""add_group_department_and_is_active

Revision ID: e4a2c8f1b903
Revises: d8f1b5a7c901
Create Date: 2026-07-29 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e4a2c8f1b903"
down_revision: Union[str, None] = "d8f1b5a7c901"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("groups", sa.Column("department", sa.String(length=100), nullable=True))
    op.add_column(
        "groups",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )


def downgrade() -> None:
    op.drop_column("groups", "is_active")
    op.drop_column("groups", "department")
