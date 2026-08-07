"""add level and assigned_by to approvals

Revision ID: d9a5638ff5f0
Revises: 2cbff9fc19ed
Create Date: 2026-08-06 07:30:47.770235

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd9a5638ff5f0'
down_revision: Union[str, Sequence[str], None] = '2cbff9fc19ed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('approvals', sa.Column('assigned_by', sa.Integer(), nullable=True))
    op.add_column('approvals', sa.Column('level', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'approvals', 'users', ['assigned_by'], ['id'])


def downgrade() -> None:
    op.drop_constraint(None, 'approvals', type_='foreignkey')
    op.drop_column('approvals', 'level')
    op.drop_column('approvals', 'assigned_by')