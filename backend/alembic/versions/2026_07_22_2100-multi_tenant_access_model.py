"""Multi tenant access model redesign

Revision ID: b92a8740cdef
Revises: f1779bb0dc76
Create Date: 2026-07-22 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision: str = 'b92a8740cdef'
down_revision: Union[str, None] = 'f1779bb0dc76'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001'
DEFAULT_GROUP_ID = '00000000-0000-0000-0000-000000000002'


def upgrade() -> None:
    # 1. Create company_role enum
    company_role_enum = postgresql.ENUM('admin', 'manager', 'employee', name='company_role')
    company_role_enum.create(op.get_bind(), checkfirst=True)

    # 2. Create companies table
    op.create_table(
        'companies',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_companies_slug'), 'companies', ['slug'], unique=True)

    # 3. Create groups table
    op.create_table(
        'groups',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_groups_company_id'), 'groups', ['company_id'], unique=False)

    # 4. Create memberships table
    op.create_table(
        'memberships',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('role', sa.Enum('admin', 'manager', 'employee', name='company_role'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'company_id', name='uq_user_company_membership')
    )
    op.create_index(op.f('ix_memberships_company_id'), 'memberships', ['company_id'], unique=False)
    op.create_index(op.f('ix_memberships_user_id'), 'memberships', ['user_id'], unique=False)

    # 5. Create group_memberships table
    op.create_table(
        'group_memberships',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('group_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('group_id', 'user_id', name='uq_group_user_membership')
    )
    op.create_index(op.f('ix_group_memberships_group_id'), 'group_memberships', ['group_id'], unique=False)
    op.create_index(op.f('ix_group_memberships_user_id'), 'group_memberships', ['user_id'], unique=False)

    # 6. Data Migration: Create default company and group
    op.execute(
        f"INSERT INTO companies (id, name, slug, created_at) "
        f"VALUES ('{DEFAULT_COMPANY_ID}', 'Default Company', 'default-company', NOW()) "
        f"ON CONFLICT DO NOTHING"
    )
    op.execute(
        f"INSERT INTO groups (id, company_id, name, created_at) "
        f"VALUES ('{DEFAULT_GROUP_ID}', '{DEFAULT_COMPANY_ID}', 'Default Group', NOW()) "
        f"ON CONFLICT DO NOTHING"
    )

    # 7. Migrate existing users into memberships and group_memberships
    op.execute(
        f"INSERT INTO memberships (id, user_id, company_id, role, created_at) "
        f"SELECT gen_random_uuid(), id, '{DEFAULT_COMPANY_ID}', "
        f"CASE WHEN role::text = 'ADMIN' THEN 'admin'::company_role "
        f"     WHEN role::text = 'MANAGER' THEN 'manager'::company_role "
        f"     ELSE 'employee'::company_role END, NOW() "
        f"FROM users "
        f"ON CONFLICT DO NOTHING"
    )

    op.execute(
        f"INSERT INTO group_memberships (id, group_id, user_id, created_at) "
        f"SELECT gen_random_uuid(), '{DEFAULT_GROUP_ID}', id, NOW() "
        f"FROM users "
        f"ON CONFLICT DO NOTHING"
    )

    # 8. Add company_id and group_id to decisions
    op.add_column('decisions', sa.Column('company_id', sa.UUID(), nullable=True))
    op.add_column('decisions', sa.Column('group_id', sa.UUID(), nullable=True))

    op.execute(f"UPDATE decisions SET company_id = '{DEFAULT_COMPANY_ID}' WHERE company_id IS NULL")
    op.execute(f"UPDATE decisions SET group_id = '{DEFAULT_GROUP_ID}' WHERE group_id IS NULL")

    op.alter_column('decisions', 'company_id', nullable=False)
    op.alter_column('decisions', 'group_id', nullable=False)

    op.create_foreign_key('fk_decisions_company_id', 'decisions', 'companies', ['company_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_decisions_group_id', 'decisions', 'groups', ['group_id'], ['id'], ondelete='CASCADE')

    op.create_index('ix_decisions_company_group_status', 'decisions', ['company_id', 'group_id', 'status'], unique=False)
    op.create_index(op.f('ix_decisions_company_id'), 'decisions', ['company_id'], unique=False)
    op.create_index(op.f('ix_decisions_group_id'), 'decisions', ['group_id'], unique=False)

    # 9. Drop team_id and role from users
    op.drop_constraint('users_team_id_fkey', 'users', type_='foreignkey')
    op.drop_column('users', 'team_id')
    op.drop_column('users', 'role')


def downgrade() -> None:
    op.add_column('users', sa.Column('role', sa.Enum('EMPLOYEE', 'REVIEWER', 'MANAGER', 'ADMIN', name='user_role'), nullable=True))
    op.add_column('users', sa.Column('team_id', sa.UUID(), nullable=True))
    op.create_foreign_key('users_team_id_fkey', 'users', 'teams', ['team_id'], ['id'])

    op.drop_index(op.f('ix_decisions_group_id'), table_name='decisions')
    op.drop_index(op.f('ix_decisions_company_id'), table_name='decisions')
    op.drop_index('ix_decisions_company_group_status', table_name='decisions')
    op.drop_constraint('fk_decisions_group_id', 'decisions', type_='foreignkey')
    op.drop_constraint('fk_decisions_company_id', 'decisions', type_='foreignkey')
    op.drop_column('decisions', 'group_id')
    op.drop_column('decisions', 'company_id')

    op.drop_table('group_memberships')
    op.drop_table('memberships')
    op.drop_table('groups')
    op.drop_table('companies')
