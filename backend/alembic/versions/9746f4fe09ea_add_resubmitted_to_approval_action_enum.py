"""add resubmitted to approval action enum

Revision ID: 9746f4fe09ea
Revises: 08baffd1d082
Create Date: 2026-07-28 12:20:18.532100

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9746f4fe09ea'
down_revision: Union[str, Sequence[str], None] = '08baffd1d082'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE approvalaction ADD VALUE IF NOT EXISTS 'resubmitted'")


def downgrade() -> None:
    """Downgrade schema."""
    # PostgreSQL doesn't support removing enum values directly; no-op
    pass
