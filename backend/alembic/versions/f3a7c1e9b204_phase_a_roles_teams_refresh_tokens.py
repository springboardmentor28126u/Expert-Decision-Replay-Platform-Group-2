"""phase A: create roles, teams, refresh_tokens; seed roles

Revision ID: f3a7c1e9b204
Revises: 75d3cf5246e8
Create Date: 2026-08-04

Phase A of the shared-database migration (see migration roadmap /
Phase 0 comparison report). Purely additive:

  - Creates 3 new tables (roles, teams, refresh_tokens). None of them
    exist on the shared DB today, so there is no existing data to
    collide with.
  - Seeds the 4 fixed roles by name, matching app.models.enums.RoleName
    exactly, including "administrator" (not the shared DB's legacy
    users.role enum value "admin" — that value gets remapped onto this
    seed data in a later phase, not the other way around).

Deliberately NOT done here (see module-level NOTE comments below):
  - teams.manager_id and refresh_tokens.user_id are created as plain
    UUID columns with NO foreign key constraint yet, because
    shared.users.id is still `integer` at this point in the migration.
    A UUID column cannot reference an integer primary key. Both FKs are
    added in the phase that converts users.id to UUID.
  - No existing table is altered, renamed, or dropped.

Rollback: drops all 3 tables (and their seed rows along with them).
Safe — nothing in the shared DB references these tables yet, since this
is the migration that creates them for the first time.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f3a7c1e9b204'
down_revision: Union[str, None] = '75d3cf5246e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- roles -----------------------------------------------------
    op.create_table(
        'roles',
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_roles_name'), 'roles', ['name'], unique=True)

    # --- teams -------------------------------------------------------
    op.create_table(
        'teams',
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        # NOTE: manager_id intentionally has NO ForeignKeyConstraint yet.
        # shared.users.id is still `integer`; this column is UUID.
        # The FK (manager_id -> users.id, ON DELETE SET NULL) is added
        # in the phase that converts users.id to UUID.
        sa.Column('manager_id', sa.UUID(), nullable=True),
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_teams_manager_id'), 'teams', ['manager_id'], unique=False)
    op.create_index(op.f('ix_teams_name'), 'teams', ['name'], unique=False)

    # --- refresh_tokens ------------------------------------------------
    op.create_table(
        'refresh_tokens',
        # NOTE: user_id intentionally has NO ForeignKeyConstraint yet,
        # same reason as teams.manager_id above.
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('token_hash', sa.String(length=255), nullable=False),
        sa.Column('jti', sa.String(length=36), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_refresh_tokens_jti'), 'refresh_tokens', ['jti'], unique=True)
    op.create_index(op.f('ix_refresh_tokens_token_hash'), 'refresh_tokens', ['token_hash'], unique=True)
    op.create_index(op.f('ix_refresh_tokens_user_id'), 'refresh_tokens', ['user_id'], unique=False)

    # --- seed roles ------------------------------------------------------
    # id / created_at / updated_at fall through to their server_default;
    # only name/description are supplied. Canonical values from
    # app.models.enums.RoleName — "administrator", not the shared DB's
    # legacy "admin" (that gets remapped onto this row in a later phase).
    roles_table = sa.table(
        'roles',
        sa.column('name', sa.String),
        sa.column('description', sa.String),
    )
    op.bulk_insert(
        roles_table,
        [
            {'name': 'employee', 'description': 'Standard employee — creates and views decisions.'},
            {'name': 'reviewer', 'description': 'Reviews and approves/rejects assigned decisions.'},
            {'name': 'manager', 'description': 'Manages a team; approves decisions; views team reports.'},
            {'name': 'administrator', 'description': 'Full system access — user, role, and team management.'},
        ],
    )


def downgrade() -> None:
    op.drop_table('refresh_tokens')
    op.drop_index(op.f('ix_teams_name'), table_name='teams')
    op.drop_index(op.f('ix_teams_manager_id'), table_name='teams')
    op.drop_table('teams')
    op.drop_index(op.f('ix_roles_name'), table_name='roles')
    op.drop_table('roles')
