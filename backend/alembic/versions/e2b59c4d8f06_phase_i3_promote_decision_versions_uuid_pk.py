"""phase I3: promote decision_versions.id_uuid to primary key, drop legacy integer id

Revision ID: e2b59c4d8f06
Revises: d1a68f3c7e94
Create Date: 2026-08-04

Same simplified promotion as alternatives (H3) -- zero foreign keys
reference decision_versions(id), so no other table's columns need
dropping/renaming/re-pointing. Drop old PK, drop old integer id and
its sequence, rename id_uuid -> id, add new PK.

Verified beforehand: zero views, zero triggers touch decision_versions.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'e2b59c4d8f06'
down_revision: Union[str, None] = 'd1a68f3c7e94'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('decision_versions_pkey', 'decision_versions', type_='primary')
    op.drop_column('decision_versions', 'id')
    op.execute("DROP SEQUENCE IF EXISTS decision_versions_id_seq")

    op.alter_column('decision_versions', 'id_uuid', new_column_name='id')
    op.create_primary_key('decision_versions_pkey', 'decision_versions', ['id'])
    op.execute(
        "ALTER TABLE decision_versions RENAME CONSTRAINT uq_decision_versions_id_uuid "
        "TO uq_decision_versions_id_legacy_anchor"
    )


def downgrade() -> None:
    raise NotImplementedError(
        "Downgrading past the decision_versions PK promotion is not supported -- "
        "the old integer id and its sequence are permanently dropped in "
        "upgrade(). Restore from a pre-I3 snapshot/branch instead."
    )
