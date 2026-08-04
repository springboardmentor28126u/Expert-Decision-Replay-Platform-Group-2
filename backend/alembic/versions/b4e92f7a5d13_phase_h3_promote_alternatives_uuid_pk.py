"""phase H3: promote alternatives.id_uuid to primary key, drop legacy integer id

Revision ID: b4e92f7a5d13
Revises: a7d51e6f39c8
Create Date: 2026-08-04

Simpler than the users/decisions promotion -- discovery confirmed zero
foreign keys reference alternatives(id), so there are no other tables'
columns to drop/rename/re-point here. Just: drop old PK, drop old
integer id and its sequence, rename id_uuid -> id, add new PK.
uq_alternatives_id_uuid is kept (not dropped) purely for consistency
with the pattern used elsewhere, though nothing is actually anchored
to it this time -- harmless either way, renamed for clarity.

Verified beforehand: zero views, zero triggers touch alternatives.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b4e92f7a5d13'
down_revision: Union[str, None] = 'a7d51e6f39c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('alternatives_pkey', 'alternatives', type_='primary')
    op.drop_column('alternatives', 'id')
    op.execute("DROP SEQUENCE IF EXISTS alternatives_id_seq")

    op.alter_column('alternatives', 'id_uuid', new_column_name='id')
    op.create_primary_key('alternatives_pkey', 'alternatives', ['id'])
    op.execute("ALTER TABLE alternatives RENAME CONSTRAINT uq_alternatives_id_uuid TO uq_alternatives_id_legacy_anchor")


def downgrade() -> None:
    raise NotImplementedError(
        "Downgrading past the alternatives PK promotion is not supported -- "
        "the old integer id and its sequence are permanently dropped in "
        "upgrade(). Restore from a pre-H3 snapshot/branch instead."
    )
