"""phase K3: add approvals.id_uuid, populate, unique constraint

Revision ID: c6f14b8e0a39
Revises: b5e03a7d9f28
Create Date: 2026-08-04

Same staged pattern as every other table. Zero foreign keys reference
approvals(id) (confirmed in discovery) -- no other table's backfill
stage needed, same as alternatives/decision_versions. Operates on the
22 consolidated live rows only -- _legacy_approval_actions (32 rows)
is untouched, permanently, and never gets a UUID id of its own since
it's a pure historical archive, not a live table the app queries.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c6f14b8e0a39'
down_revision: Union[str, None] = 'b5e03a7d9f28'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('approvals', sa.Column('id_uuid', postgresql.UUID(as_uuid=True), nullable=True))
    op.execute("UPDATE approvals SET id_uuid = gen_random_uuid()")
    op.alter_column('approvals', 'id_uuid', nullable=False)
    op.create_unique_constraint('uq_approvals_id_uuid', 'approvals', ['id_uuid'])


def downgrade() -> None:
    op.drop_constraint('uq_approvals_id_uuid', 'approvals', type_='unique')
    op.drop_column('approvals', 'id_uuid')
