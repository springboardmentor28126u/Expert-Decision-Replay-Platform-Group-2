"""add_user_role_column

Revision ID: 3cd8b9b94aac
Revises: b92a8740cdef
Create Date: 2026-07-24 09:25:16.141598

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3cd8b9b94aac'
down_revision: Union[str, None] = 'b92a8740cdef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add role column to users table (type already created by create_all)
    op.add_column('users', sa.Column(
        'role',
        sa.Enum('admin', 'manager', 'reviewer', 'employee', name='user_role', create_type=False),
        nullable=False,
        server_default='employee',
    ))


def downgrade() -> None:
    op.drop_column('users', 'role')