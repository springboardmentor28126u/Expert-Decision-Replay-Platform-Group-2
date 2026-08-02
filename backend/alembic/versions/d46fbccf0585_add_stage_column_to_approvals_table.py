"""add stage column to approvals table

Revision ID: d46fbccf0585
Revises: 9746f4fe09ea
Create Date: 2026-07-30 11:22:55.888655

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd46fbccf0585'
down_revision: Union[str, Sequence[str], None] = '9746f4fe09ea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('approvals', sa.Column('stage', sa.Integer(), nullable=False, server_default='1'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('approvals', 'stage')