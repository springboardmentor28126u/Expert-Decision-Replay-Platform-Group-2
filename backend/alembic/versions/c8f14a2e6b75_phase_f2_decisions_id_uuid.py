"""phase F2: add decisions.id_uuid, populate, unique constraint

Revision ID: c8f14a2e6b75
Revises: b3e07d5a19c4
Create Date: 2026-08-04

Mirrors Phase C1 (users) exactly, for decisions. Parallel UUID column,
explicit per-row backfill, UNIQUE (not yet PRIMARY KEY) -- lets Phase
F3 attach real, enforced foreign keys before anything is promoted.
Old integer id, its sequence, and its PRIMARY KEY are untouched.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c8f14a2e6b75'
down_revision: Union[str, None] = 'b3e07d5a19c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('decisions', sa.Column('id_uuid', postgresql.UUID(as_uuid=True), nullable=True))
    op.execute("UPDATE decisions SET id_uuid = gen_random_uuid()")
    op.alter_column('decisions', 'id_uuid', nullable=False)
    op.create_unique_constraint('uq_decisions_id_uuid', 'decisions', ['id_uuid'])


def downgrade() -> None:
    op.drop_constraint('uq_decisions_id_uuid', 'decisions', type_='unique')
    op.drop_column('decisions', 'id_uuid')
