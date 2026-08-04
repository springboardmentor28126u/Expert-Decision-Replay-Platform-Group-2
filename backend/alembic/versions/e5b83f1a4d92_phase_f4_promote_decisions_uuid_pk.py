"""phase F4: promote decisions.id_uuid to primary key, drop legacy integer id

Revision ID: e5b83f1a4d92
Revises: d2a69c3f8e01
Create Date: 2026-08-04

Mirrors Phase C3 (users) exactly, for decisions:

  1. Drop the 4 old integer FK constraints.
  2. Drop the 4 old integer decision_id columns (their auto-created
     indexes, if any, drop with them -- none of the 4 had one before
     this migration series).
  3. Rename decision_id_new -> decision_id on all 4 tables.
  4. Drop old decisions_pkey (integer), drop old integer id column and
     its sequence.
  5. Rename id_uuid -> id, add the new PRIMARY KEY. uq_decisions_id_uuid
     is deliberately NOT dropped (same reasoning as users: the 4 FK
     constraints from Phase F3 are permanently anchored to it, and a
     redundant UNIQUE alongside the PRIMARY KEY is harmless) -- just
     renamed for clarity.

Verified beforehand: zero views, zero triggers touch decisions.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'e5b83f1a4d92'
down_revision: Union[str, None] = 'd2a69c3f8e01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_OLD_FKS = [
    ('alternatives_decision_id_fkey', 'alternatives'),
    ('approvals_decision_id_fkey', 'approvals'),
    ('decision_versions_decision_id_fkey', 'decision_versions'),
    ('discussion_messages_decision_id_fkey', 'discussion_messages'),
]
_OLD_COLUMNS = [
    ('alternatives', 'decision_id'),
    ('approvals', 'decision_id'),
    ('decision_versions', 'decision_id'),
    ('discussion_messages', 'decision_id'),
]
_RENAMES = [
    ('alternatives', 'decision_id_new', 'decision_id'),
    ('approvals', 'decision_id_new', 'decision_id'),
    ('decision_versions', 'decision_id_new', 'decision_id'),
    ('discussion_messages', 'decision_id_new', 'decision_id'),
]


def upgrade() -> None:
    for fk_name, table in _OLD_FKS:
        op.drop_constraint(fk_name, table, type_='foreignkey')

    for table, col in _OLD_COLUMNS:
        op.drop_column(table, col)

    for table, old_name, new_name in _RENAMES:
        op.alter_column(table, old_name, new_column_name=new_name)

    op.drop_constraint('decisions_pkey', 'decisions', type_='primary')
    op.drop_column('decisions', 'id')
    op.execute("DROP SEQUENCE IF EXISTS decisions_id_seq")

    op.alter_column('decisions', 'id_uuid', new_column_name='id')
    op.create_primary_key('decisions_pkey', 'decisions', ['id'])
    op.execute("ALTER TABLE decisions RENAME CONSTRAINT uq_decisions_id_uuid TO uq_decisions_id_legacy_anchor")


def downgrade() -> None:
    raise NotImplementedError(
        "Downgrading past the decisions PK promotion is not supported -- "
        "the old integer id and its sequence are permanently dropped in "
        "upgrade(). Restore from a pre-F4 snapshot/branch instead."
    )
