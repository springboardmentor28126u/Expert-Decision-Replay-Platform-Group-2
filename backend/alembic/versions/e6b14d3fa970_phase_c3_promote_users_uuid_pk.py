"""phase C3: promote users.id_uuid to primary key, drop legacy integer id

Revision ID: e6b14d3fa970
Revises: d5a03c2f8b69
Create Date: 2026-08-04

Final stage of the users PK conversion. Sequence matters and is
enforced by Postgres itself, not just convention:

  1. Drop the 10 old integer FK constraints (a column still referenced
     by a FK cannot be dropped).
  2. Drop the 10 old integer FK columns themselves. Their two
     dependent indexes (ix_audit_logs_user_id,
     ix_discussion_messages_user_id) are dropped automatically by
     Postgres along with the columns -- no explicit DROP INDEX needed.
  3. Rename the 6 new columns that used a temporary name (collision
     avoidance in Phase C2) to their final name. The 4 that already
     had their final name in Phase C2 (actor_id, changed_by_id,
     created_by_id, recipient_id) need no action here.
  4. Drop the old users_pkey (integer), drop the old integer id
     column and its orphaned sequence.
  5. Rename users.id_uuid -> id, add the new PRIMARY KEY, and rename
     Phase C1's uq_users_id_uuid constraint for clarity.

Every FK constraint added in Phase C2 (pointing at users(id_uuid))
needs NO changes here -- Postgres automatically updates a constraint's
column reference when the column it points at is renamed. They become
correct references to users(id) the instant step 5 runs, with zero
extra statements.

IMPORTANT correction from the first attempt at this migration:
uq_users_id_uuid (Phase C1's placeholder unique constraint) is
deliberately NOT dropped. All 12 FK constraints added in Phase C2 are
permanently anchored to that specific constraint's backing index --
not to "whichever unique constraint exists on this column" -- so even
after id_uuid is renamed to id and a new PRIMARY KEY is added, the FKs
stay pointed at the original (now oddly-named) unique constraint, not
the new PK. Dropping it fails with DependentObjectsStillExistError
even after PK promotion, and CASCADE would have destroyed the FK
safety net Phase C2 built and verified. The constraint is instead just
renamed for clarity; a redundant UNIQUE alongside the PRIMARY KEY on
the same column is harmless.

Verified beforehand: zero views, zero triggers touch users. Confirmed
by direct query, not assumed.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'e6b14d3fa970'
down_revision: Union[str, None] = 'd5a03c2f8b69'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_OLD_FKS = [
    ('approvals_reviewer_id_fkey', 'approvals'),
    ('audit_logs_user_id_fkey', 'audit_logs'),
    ('decision_versions_changed_by_fkey', 'decision_versions'),
    ('decisions_assigned_reviewer_id_fkey', 'decisions'),
    ('decisions_created_by_fkey', 'decisions'),
    ('discussion_messages_user_id_fkey', 'discussion_messages'),
    ('notifications_user_id_fkey', 'notifications'),
    ('reviewer_assignments_assigned_by_fkey', 'reviewer_assignments'),
    ('reviewer_assignments_reviewer_id_fkey', 'reviewer_assignments'),
    ('uploaded_files_user_id_fkey', 'uploaded_files'),
]

_OLD_COLUMNS = [
    ('approvals', 'reviewer_id'),
    ('audit_logs', 'user_id'),
    ('decision_versions', 'changed_by'),
    ('decisions', 'assigned_reviewer_id'),
    ('decisions', 'created_by'),
    ('discussion_messages', 'user_id'),
    ('notifications', 'user_id'),
    ('reviewer_assignments', 'assigned_by'),
    ('reviewer_assignments', 'reviewer_id'),
    ('uploaded_files', 'user_id'),
]

_RENAMES = [
    ('approvals', 'reviewer_id_new', 'reviewer_id'),
    ('decisions', 'assigned_reviewer_id_uuid', 'assigned_reviewer_id'),
    ('discussion_messages', 'user_id_uuid', 'user_id'),
    ('reviewer_assignments', 'assigned_by_uuid', 'assigned_by'),
    ('reviewer_assignments', 'reviewer_id_uuid', 'reviewer_id'),
    ('uploaded_files', 'user_id_uuid', 'user_id'),
]


def upgrade() -> None:
    # 1. drop old integer FK constraints
    for fk_name, table in _OLD_FKS:
        op.drop_constraint(fk_name, table, type_='foreignkey')

    # 2. drop old integer FK columns (dependent indexes auto-dropped)
    for table, col in _OLD_COLUMNS:
        op.drop_column(table, col)

    # 3. rename new columns into their final names
    for table, old_name, new_name in _RENAMES:
        op.alter_column(table, old_name, new_column_name=new_name)

    # 4. drop old PK, old id column, old sequence.
    #    uq_users_id_uuid is deliberately NOT dropped -- see module docstring.
    op.drop_constraint('users_pkey', 'users', type_='primary')
    op.drop_column('users', 'id')
    op.execute("DROP SEQUENCE IF EXISTS users_id_seq")

    # 5. promote id_uuid -> id, add the real primary key, rename the
    #    now-redundant-but-load-bearing unique constraint for clarity
    op.alter_column('users', 'id_uuid', new_column_name='id')
    op.create_primary_key('users_pkey', 'users', ['id'])
    op.execute("ALTER TABLE users RENAME CONSTRAINT uq_users_id_uuid TO uq_users_id_legacy_anchor")


def downgrade() -> None:
    raise NotImplementedError(
        "Downgrading past the users PK promotion is not supported -- "
        "the old integer id and its sequence are permanently dropped in "
        "upgrade(). Restore from a pre-C3 snapshot/branch instead."
    )
