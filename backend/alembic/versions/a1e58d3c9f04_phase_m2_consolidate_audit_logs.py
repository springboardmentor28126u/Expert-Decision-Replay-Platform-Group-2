"""phase M2: remove archived rows from live audit_logs, resolve entity_id for the 30 survivors

Revision ID: a1e58d3c9f04
Revises: f9c47e2b6a83
Create Date: 2026-08-04

Live table now safe to consolidate -- all 1124 rows being removed are
already verbatim in _legacy_audit_logs_unrepresentable (Phase M1).

1. Delete the 1124 archived rows from the live table.
2. For the 30 remaining rows (entity_type='discussion_message',
   entity_id resolves via comments.legacy_discussion_message_id):
   resolve entity_id to the real comments.id UUID, rename
   entity_type 'discussion_message' -> 'comment' (matching what the
   entity is actually called in the current schema).
3. Tighten entity_id to NOT NULL -- safe, since all 30 remaining rows
   now have a real resolved value.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a1e58d3c9f04'
down_revision: Union[str, None] = 'f9c47e2b6a83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        DELETE FROM audit_logs
        WHERE id IN (SELECT id FROM _legacy_audit_logs_unrepresentable)
    """)

    op.add_column('audit_logs', sa.Column('entity_id_uuid', postgresql.UUID(as_uuid=True), nullable=True))
    op.execute("""
        UPDATE audit_logs a
        SET entity_id_uuid = c.id
        FROM comments c
        WHERE c.legacy_discussion_message_id = a.entity_id
          AND a.entity_type = 'discussion_message'
    """)
    op.drop_column('audit_logs', 'entity_id')
    op.alter_column('audit_logs', 'entity_id_uuid', new_column_name='entity_id')
    op.alter_column('audit_logs', 'entity_id', nullable=False)
    op.create_index('ix_audit_logs_entity_id', 'audit_logs', ['entity_id'], unique=False)

    op.execute("UPDATE audit_logs SET entity_type = 'comment' WHERE entity_type = 'discussion_message'")

    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'], unique=False)
    op.create_index('ix_audit_logs_entity_type', 'audit_logs', ['entity_type'], unique=False)
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'], unique=False)


def downgrade() -> None:
    raise NotImplementedError(
        "Downgrading past the audit_logs consolidation is not supported -- "
        "1124 rows were removed from the live table (preserved in "
        "_legacy_audit_logs_unrepresentable). Restore from a pre-M2 "
        "snapshot/branch, or manually re-insert from the archive, instead."
    )
