"""phase I2: add decision_versions.id_uuid, populate, unique constraint

Revision ID: d1a68f3c7e94
Revises: c9f47a2e5b81
Create Date: 2026-08-04

Same staged pattern as users/decisions/alternatives. Discovery found
zero foreign keys referencing decision_versions(id), same as
alternatives -- no other table's backfill stage needed.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'd1a68f3c7e94'
down_revision: Union[str, None] = 'c9f47a2e5b81'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('decision_versions', sa.Column('id_uuid', postgresql.UUID(as_uuid=True), nullable=True))
    op.execute("UPDATE decision_versions SET id_uuid = gen_random_uuid()")
    op.alter_column('decision_versions', 'id_uuid', nullable=False)
    op.create_unique_constraint('uq_decision_versions_id_uuid', 'decision_versions', ['id_uuid'])


def downgrade() -> None:
    op.drop_constraint('uq_decision_versions_id_uuid', 'decision_versions', type_='unique')
    op.drop_column('decision_versions', 'id_uuid')
