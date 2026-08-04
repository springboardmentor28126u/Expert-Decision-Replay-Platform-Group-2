"""phase B: add missing columns to users, backfill role_id

Revision ID: b2d8e4f61a37
Revises: f3a7c1e9b204
Create Date: 2026-08-04

Additive-only. Adds the 6 columns app.models.user.User requires that
don't exist on the shared users table: role_id, team_id, is_verified,
last_login_at, is_deleted, deleted_at.

role_id is backfilled from the legacy `role` enum column (employee/
reviewer/manager/admin -> roles.name), mapping admin -> administrator
per the resolved decision (migrate the data to the canonical name, not
the other way around). All 21 existing users are covered by this
mapping; role_id is tightened to NOT NULL only after backfill, so a
failure to map any row aborts the whole migration rather than leaving
a user in a broken state.

team_id has no source data to backfill from (no team concept existed
before this migration) and is nullable in the model, so it's simply
added NULL for every existing row.

FKs: role_id -> roles(id) RESTRICT and team_id -> teams(id) SET NULL
are both added in this same migration, NOT deferred -- roles.id and
teams.id are already UUID primary keys (Phase A), so no type mismatch
blocks them. The only thing still deferred, unrelated to this table's
own columns, is anything that would need to reference users.id itself
(still integer) -- that waits for the PK conversion phase.

No existing column is renamed, retyped, or dropped. `role`, `id`,
`is_active`, `updated_at` are untouched this phase.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b2d8e4f61a37'
down_revision: Union[str, None] = 'f3a7c1e9b204'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- add columns (nullable first where a backfill/default is needed) ---
    op.add_column('users', sa.Column('role_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('users', sa.Column('team_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('users', sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('users', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))

    # --- backfill role_id from the legacy `role` enum column ---
    op.execute("""
        UPDATE users
        SET role_id = roles.id
        FROM roles
        WHERE roles.name = CASE users.role::text
            WHEN 'admin' THEN 'administrator'
            WHEN 'employee' THEN 'employee'
            WHEN 'reviewer' THEN 'reviewer'
            WHEN 'manager' THEN 'manager'
        END
    """)

    # --- tighten role_id now that every row is backfilled ---
    # (fails loudly, aborting the whole transaction, if any row didn't map --
    # verified beforehand that all 4 legacy role values are covered above)
    op.alter_column('users', 'role_id', nullable=False)

    # --- indexes, matching User.role_id / User.team_id index=True ---
    op.create_index(op.f('ix_users_role_id'), 'users', ['role_id'], unique=False)
    op.create_index(op.f('ix_users_team_id'), 'users', ['team_id'], unique=False)

    # --- foreign keys ---
    op.create_foreign_key(
        'fk_users_role_id_roles', 'users', 'roles', ['role_id'], ['id'], ondelete='RESTRICT'
    )
    op.create_foreign_key(
        'fk_users_team_id_teams', 'users', 'teams', ['team_id'], ['id'], ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_users_team_id_teams', 'users', type_='foreignkey')
    op.drop_constraint('fk_users_role_id_roles', 'users', type_='foreignkey')
    op.drop_index(op.f('ix_users_team_id'), table_name='users')
    op.drop_index(op.f('ix_users_role_id'), table_name='users')
    op.drop_column('users', 'deleted_at')
    op.drop_column('users', 'is_deleted')
    op.drop_column('users', 'last_login_at')
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'team_id')
    op.drop_column('users', 'role_id')
