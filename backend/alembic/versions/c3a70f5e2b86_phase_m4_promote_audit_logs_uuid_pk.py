"""phase M4: promote audit_logs.id_uuid to primary key, drop legacy integer id

Revision ID: c3a70f5e2b86
Revises: b2f69e4d1a75
Create Date: 2026-08-04

Same simplified promotion as alternatives/decision_versions/approvals
-- zero foreign keys reference audit_logs(id). Drop old PK, drop old
integer id and its sequence, rename id_uuid -> id, add new PK.

Verified beforehand: zero views, zero triggers touch audit_logs.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c3a70f5e2b86'
down_revision: Union[str, None] = 'b2f69e4d1a75'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('audit_logs_pkey', 'audit_logs', type_='primary')
    op.drop_column('audit_logs', 'id')
    op.execute("DROP SEQUENCE IF EXISTS audit_logs_id_seq")

    op.alter_column('audit_logs', 'id_uuid', new_column_name='id')
    op.create_primary_key('audit_logs_pkey', 'audit_logs', ['id'])
    op.execute("ALTER TABLE audit_logs RENAME CONSTRAINT uq_audit_logs_id_uuid TO uq_audit_logs_id_legacy_anchor")


def downgrade() -> None:
    raise NotImplementedError(
        "Downgrading past the audit_logs PK promotion is not supported -- "
        "the old integer id and its sequence are permanently dropped in "
        "upgrade(). Restore from a pre-M4 snapshot/branch instead."
    )
