"""add problem statement column

Revision ID: 4a199f245152
Revises: afb2ac411949
Create Date: 2026-08-04 20:12:32.579686

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a199f245152'
down_revision: Union[str, Sequence[str], None] = 'afb2ac411949'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    op.add_column(
        'decisions',
        sa.Column('problem_statement', sa.Text(), nullable=True)
    )


def downgrade():
    op.drop_column(
        'decisions',
        'problem_statement'
    )



