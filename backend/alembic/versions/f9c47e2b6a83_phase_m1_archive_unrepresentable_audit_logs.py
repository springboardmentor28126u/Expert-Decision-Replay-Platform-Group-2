"""phase M1: archive audit_logs rows that cannot be faithfully represented, verbatim

Revision ID: f9c47e2b6a83
Revises: e8b36d1a4c72
Create Date: 2026-08-04

1124 of 1154 audit_logs rows cannot get a real, non-fabricated UUID
entity_id:

  - 993 rows, entity_type='decision': decisions.id was promoted to
    UUID (Phase F4) with no surviving old-integer-to-new-UUID
    crosswalk -- unrecoverable.
  - 118 rows, entity_type='user': same situation, users.id promoted
    in Phase C3 with no crosswalk -- unrecoverable.
  - 13 rows, entity_type='discussion_message': entity_id references a
    discussion_messages row that was already deleted in the original
    system before this migration ever began (confirmed: e.g. entity_id
    8 has a full create/edit/delete audit trail, all predating this
    migration, and no corresponding comments.legacy_discussion_message_id
    exists) -- the entity itself is genuinely gone, not something lost
    by this migration.

All 1124 are copied verbatim into _legacy_audit_logs_unrepresentable
before anything in the live table is touched. Per your rules 2-3-6:
every row preserved, nothing fabricated, archive kept permanently.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'f9c47e2b6a83'
down_revision: Union[str, None] = 'e8b36d1a4c72'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE _legacy_audit_logs_unrepresentable (
            id integer,
            action varchar,
            entity_type varchar,
            entity_id integer,
            details text,
            created_at timestamptz,
            log_type varchar,
            actor_id uuid,
            log_metadata jsonb,
            ip_address inet,
            archived_at timestamptz NOT NULL DEFAULT now(),
            archive_reason varchar NOT NULL
        )
    """)
    op.execute("""
        INSERT INTO _legacy_audit_logs_unrepresentable
            (id, action, entity_type, entity_id, details, created_at,
             log_type, actor_id, log_metadata, ip_address, archive_reason)
        SELECT id, action, entity_type, entity_id, details, created_at,
               log_type, actor_id, log_metadata, ip_address,
               CASE
                   WHEN entity_type IN ('decision', 'user') THEN 'no surviving PK crosswalk after UUID promotion'
                   ELSE 'referenced entity was deleted before migration began'
               END
        FROM audit_logs
        WHERE entity_type IN ('decision', 'user')
           OR (entity_type = 'discussion_message'
               AND NOT EXISTS (
                   SELECT 1 FROM comments c WHERE c.legacy_discussion_message_id = audit_logs.entity_id
               ))
    """)


def downgrade() -> None:
    op.execute("DROP TABLE _legacy_audit_logs_unrepresentable")
