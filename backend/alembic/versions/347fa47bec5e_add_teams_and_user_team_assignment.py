"""add teams and user team assignment

Revision ID: 347fa47bec5e
Revises: 75d3cf5246e8
Create Date: 2026-08-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "347fa47bec5e"
down_revision: Union[str, Sequence[str], None] = "75d3cf5246e8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add teams and team assignment support."""

    # 1. Create teams table.
    #
    # manager_id is initially created without a foreign key because
    # users.team_id will also reference teams.id. Both columns/tables
    # must exist before the two foreign keys are created.
    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("manager_id", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    # Index for teams.id.
    op.create_index(
        "ix_teams_id",
        "teams",
        ["id"],
        unique=False,
    )

    # 2. Add team_id to existing users table.
    #
    # Nullable is intentional because existing users may not belong
    # to a team yet.
    op.add_column(
        "users",
        sa.Column("team_id", sa.Integer(), nullable=True),
    )

    # 3. Create User -> Team relationship.
    op.create_foreign_key(
        "fk_users_team_id",
        "users",
        "teams",
        ["team_id"],
        ["id"],
    )

    # 4. Create Team -> Manager relationship.
    op.create_foreign_key(
        "fk_teams_manager_id",
        "teams",
        "users",
        ["manager_id"],
        ["id"],
    )


def downgrade() -> None:
    """Remove teams and team assignment support."""

    # 1. Remove Team -> Manager relationship.
    op.drop_constraint(
        "fk_teams_manager_id",
        "teams",
        type_="foreignkey",
    )

    # 2. Remove User -> Team relationship.
    op.drop_constraint(
        "fk_users_team_id",
        "users",
        type_="foreignkey",
    )

    # 3. Remove team_id from users.
    op.drop_column(
        "users",
        "team_id",
    )

    # 4. Remove teams.id index.
    op.drop_index(
        "ix_teams_id",
        table_name="teams",
    )

    # 5. Remove teams table.
    op.drop_table(
        "teams",
    )