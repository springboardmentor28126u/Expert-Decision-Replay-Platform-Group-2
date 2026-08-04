"""phase M3: add audit_logs.id_uuid, populate, unique constraint

Revision ID: b2f69e4d1a75
Revises: a1e58d3c9f04
Create Date: 2026-08-04

Same staged pattern as every other table. Zero foreign keys reference
audit_logs(id) (confirmed). Operates on the 30 consolidated live rows;
_legacy_audit_logs_unrepresentable is untouched.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b2f69e4d1a75'
down_revision: Union[str, None] = 'a1e58d3c9f04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('audit_logs', sa.Column('id_uuid', postgresql.UUID(as_uuid=True), nullable=True))
    op.execute("UPDATE audit_logs SET id_uuid = gen_random_uuid()")
    op.alter_column('audit_logs', 'id_uuid', nullable=False)
    op.create_unique_constraint('uq_audit_logs_id_uuid', 'audit_logs', ['id_uuid'])


def downgrade() -> None:
    op.drop_constraint('uq_audit_logs_id_uuid', 'audit_logs', type_='unique')
    op.drop_column('audit_logs', 'id_uuid')
