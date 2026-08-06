"""add created_by column to decisions

Revision ID: 31b76a6c84d3
Revises: da19f1d16534
Create Date: 2026-08-04 20:45:29.920764

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '31b76a6c84d3'
down_revision: Union[str, Sequence[str], None] = 'da19f1d16534'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from alembic import op
import sqlalchemy as sa


revision = 'new_id'
down_revision = 'afb2ac411949'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'decisions',
        sa.Column('created_by', sa.Integer(), nullable=True)
    )

    op.create_foreign_key(
        'fk_decisions_created_by',
        'decisions',
        'users',
        ['created_by'],
        ['id']
    )


def downgrade():
    op.drop_constraint(
        'fk_decisions_created_by',
        'decisions',
        type_='foreignkey'
    )

    op.drop_column(
        'decisions',
        'created_by'
    )



