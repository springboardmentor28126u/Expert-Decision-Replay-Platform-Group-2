"""phase Q1: add missing notifications columns, convert type to native enum

Revision ID: a7e14d9c3b52
Revises: f6d03c8b5e24
Create Date: 2026-08-04

Notifications never received any compatibility work until now.
recipient_id was already fixed incidentally (users FK cascade).
Remaining gaps against app.models.notification.Notification:

  - related_entity_type / related_entity_id: MISSING. Model wants
    both NOT NULL, but notifications never tracked this concept
    before -- no source data exists to backfill from. Added NULLABLE
    for all 294 existing rows, a deliberate, flagged deviation from
    the model rather than a fabricated value -- same precedent as
    alternatives.created_by_id.
  - updated_at: MISSING entirely (same situation as several other
    tables). Added NOT NULL DEFAULT now(), single step.
  - type: varchar, default 'info', not the native notification_type
    enum. Resolved mapping (agreed earlier in this migration, not a
    new decision) applied to all 294 rows using ONLY the model's
    existing 6 values, per the "do not add legacy types unless
    required" rule from that decision:
        DECISION_APPROVED (94), DECISION_REJECTED (19) -> DECISION_STATUS_CHANGE
        NEW_DISCUSSION (90)                              -> COMMENT_MENTION
        info (54), DECISION_CREATED (37)                  -> SYSTEM
    Native enum created with uppercase labels, matching every other
    PgEnum column converted so far (SQLAlchemy serializes by member
    name, not .value, since this model doesn't set values_callable
    either).

id (still integer) is converted in Q2/Q3. Zero foreign keys reference
notifications(id) -- confirmed, no other table touched.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a7e14d9c3b52'
down_revision: Union[str, None] = 'f6d03c8b5e24'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('notifications', sa.Column('related_entity_type', sa.String(length=50), nullable=True))
    op.add_column('notifications', sa.Column('related_entity_id', postgresql.UUID(as_uuid=True), nullable=True))

    op.add_column('notifications', sa.Column(
        'updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')
    ))

    op.execute(
        "CREATE TYPE notification_type AS ENUM "
        "('APPROVAL_REQUEST', 'APPROVAL_DECISION', 'COMMENT_MENTION', "
        "'DECISION_STATUS_CHANGE', 'ESCALATION', 'SYSTEM')"
    )
    op.add_column('notifications', sa.Column('type_new', postgresql.ENUM(
        'APPROVAL_REQUEST', 'APPROVAL_DECISION', 'COMMENT_MENTION',
        'DECISION_STATUS_CHANGE', 'ESCALATION', 'SYSTEM',
        name='notification_type', create_type=False,
    ), nullable=True))
    op.execute("""
        UPDATE notifications SET type_new = CASE type
            WHEN 'DECISION_APPROVED' THEN 'DECISION_STATUS_CHANGE'
            WHEN 'DECISION_REJECTED' THEN 'DECISION_STATUS_CHANGE'
            WHEN 'NEW_DISCUSSION' THEN 'COMMENT_MENTION'
            WHEN 'info' THEN 'SYSTEM'
            WHEN 'DECISION_CREATED' THEN 'SYSTEM'
        END::notification_type
    """)
    op.drop_column('notifications', 'type')
    op.alter_column('notifications', 'type_new', new_column_name='type')
    op.alter_column('notifications', 'type', nullable=False)
    op.create_index('ix_notifications_type', 'notifications', ['type'], unique=False)
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'], unique=False)
    # ix_notifications_recipient_id already exists (created in Phase C2)


def downgrade() -> None:
    raise NotImplementedError(
        "Downgrading past the notifications type conversion is not "
        "supported -- restore from a pre-Q1 snapshot/branch instead."
    )
