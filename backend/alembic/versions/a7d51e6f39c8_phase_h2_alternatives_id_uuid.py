"""phase H2: add alternatives.id_uuid, populate, unique constraint

Revision ID: a7d51e6f39c8
Revises: f6c38b9a2d47
Create Date: 2026-08-04

Same staged pattern as users (C1) and decisions (F2), per your
instruction, even though the discovery step found zero foreign keys
referencing alternatives(id) -- no other table needs a parallel
backfill stage this time, but the id column itself is still promoted
carefully rather than a direct ALTER COLUMN TYPE.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a7d51e6f39c8'
down_revision: Union[str, None] = 'f6c38b9a2d47'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('alternatives', sa.Column('id_uuid', postgresql.UUID(as_uuid=True), nullable=True))
    op.execute("UPDATE alternatives SET id_uuid = gen_random_uuid()")
    op.alter_column('alternatives', 'id_uuid', nullable=False)
    op.create_unique_constraint('uq_alternatives_id_uuid', 'alternatives', ['id_uuid'])


def downgrade() -> None:
    op.drop_constraint('uq_alternatives_id_uuid', 'alternatives', type_='unique')
    op.drop_column('alternatives', 'id_uuid')
