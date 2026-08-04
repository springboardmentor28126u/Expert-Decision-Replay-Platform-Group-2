"""phase Q3: promote notifications.id_uuid to primary key, drop legacy integer id

Revision ID: c9a36f1e5d74
Revises: b8f25e0d4c63
Create Date: 2026-08-04

Same simplified promotion pattern -- zero foreign keys reference
notifications(id). Verified beforehand: zero views, zero triggers.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c9a36f1e5d74'
down_revision: Union[str, None] = 'b8f25e0d4c63'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('notifications_pkey', 'notifications', type_='primary')
    op.drop_column('notifications', 'id')
    op.execute("DROP SEQUENCE IF EXISTS notifications_id_seq")

    op.alter_column('notifications', 'id_uuid', new_column_name='id')
    op.create_primary_key('notifications_pkey', 'notifications', ['id'])
    op.execute("ALTER TABLE notifications RENAME CONSTRAINT uq_notifications_id_uuid TO uq_notifications_id_legacy_anchor")


def downgrade() -> None:
    raise NotImplementedError(
        "Downgrading past the notifications PK promotion is not supported -- "
        "restore from a pre-Q3 snapshot/branch instead."
    )
