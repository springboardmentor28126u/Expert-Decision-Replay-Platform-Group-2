"""merge approval stage and audit log migrations

Revision ID: 7eae8694c004
Revises: d46fbccf0585, fc0f4741dcef
Create Date: 2026-07-30 18:49:09.493547

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7eae8694c004'
down_revision: Union[str, Sequence[str], None] = ('d46fbccf0585', 'fc0f4741dcef')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
