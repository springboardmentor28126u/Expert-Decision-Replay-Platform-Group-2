"""merge alternatives and discussion branches

Revision ID: f19688896ca7
Revises: a66e2506a519, c2584318a6e7
Create Date: 2026-07-20 11:22:24.326502

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f19688896ca7'
down_revision: Union[str, Sequence[str], None] = ('a66e2506a519', 'c2584318a6e7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
