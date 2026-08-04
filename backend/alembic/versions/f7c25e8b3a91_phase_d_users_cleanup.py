"""phase D: fix registration (drop legacy role) and backfill NULL updated_at

Revision ID: f7c25e8b3a91
Revises: e6b14d3fa970
Create Date: 2026-08-04

Fixes the two runtime blockers found after the users PK migration,
nothing else:

1. Registration failed with NotNullViolationError on the legacy `role`
   enum column -- the User model has no `role` attribute at all (only
   `role_id`), so the ORM never supplies a value for it. `role_id` was
   independently verified twice (Phase B, and again immediately before
   this migration) to be a complete, zero-mismatch, zero-NULL replacement
   for all 21 users, so this drops `role` entirely rather than just
   loosening its constraint -- there is nothing left depending on it.
   The `userrole` enum TYPE itself is deliberately left in place (not
   dropped): it's harmless once unused, and keeping it is what makes a
   genuine, working downgrade() possible.

2. GET /users/me failed serializing `updated_at` (required, non-optional
   datetime) for users where it was NULL -- 18 of 21, confirmed live.
   Backfilled from `created_at` (verified non-null for all 18 affected
   rows) -- the conventional choice when a row was never explicitly
   updated after creation. Column then gets server_default now() and
   NOT NULL, matching TimestampMixin exactly.

Preserves every existing user -- 0 rows added, removed, or re-keyed.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'f7c25e8b3a91'
down_revision: Union[str, None] = 'e6b14d3fa970'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- fix 1: eliminate the legacy role dependency ---
    op.drop_column('users', 'role')

    # --- fix 2: backfill NULL updated_at, then match the model exactly ---
    op.execute("UPDATE users SET updated_at = created_at WHERE updated_at IS NULL")
    op.alter_column('users', 'updated_at', server_default=sa.text('now()'))
    op.alter_column('users', 'updated_at', nullable=False)


def downgrade() -> None:
    # Restore updated_at to its original loose shape (data is left
    # backfilled -- downgrading schema strictness should not destroy
    # good data by re-nulling it).
    op.alter_column('users', 'updated_at', nullable=True)
    op.alter_column('users', 'updated_at', server_default=None)

    # Recreate `role` and reverse-backfill from role_id / roles.name.
    # Requires the userrole enum type to still exist -- it was never dropped.
    op.add_column('users', sa.Column('role', postgresql.ENUM(name='userrole', create_type=False), nullable=True))
    op.execute("""
        UPDATE users
        SET role = CASE (SELECT name FROM roles WHERE roles.id = users.role_id)
            WHEN 'administrator' THEN 'admin'
            ELSE (SELECT name FROM roles WHERE roles.id = users.role_id)
        END::userrole
    """)
    op.alter_column('users', 'role', nullable=False)
