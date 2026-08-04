"""phase K4: promote approvals.id_uuid to primary key, drop legacy integer id

Revision ID: d7a25c9f1b40
Revises: c6f14b8e0a39
Create Date: 2026-08-04

Same simplified promotion as alternatives/decision_versions -- zero
foreign keys reference approvals(id). Drop old PK, drop old integer id
and its sequence, rename id_uuid -> id, add new PK.

Verified beforehand: zero views, zero triggers touch approvals.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd7a25c9f1b40'
down_revision: Union[str, None] = 'c6f14b8e0a39'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('approvals_pkey', 'approvals', type_='primary')
    op.drop_column('approvals', 'id')
    op.execute("DROP SEQUENCE IF EXISTS approvals_id_seq")

    op.alter_column('approvals', 'id_uuid', new_column_name='id')
    op.create_primary_key('approvals_pkey', 'approvals', ['id'])
    op.execute("ALTER TABLE approvals RENAME CONSTRAINT uq_approvals_id_uuid TO uq_approvals_id_legacy_anchor")


def downgrade() -> None:
    raise NotImplementedError(
        "Downgrading past the approvals PK promotion is not supported -- "
        "the old integer id and its sequence are permanently dropped in "
        "upgrade(). Restore from a pre-K4 snapshot/branch instead."
    )
