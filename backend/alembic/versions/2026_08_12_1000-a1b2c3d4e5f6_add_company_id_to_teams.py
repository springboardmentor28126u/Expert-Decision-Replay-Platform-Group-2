"""add_company_id_to_teams

Adds company_id foreign key to teams table to enable multi-tenant
team scoping. Backfills existing teams to the default company.

Revision ID: a1b2c3d4e5f6
Revises: f5e8d4a2c9b1
Create Date: 2026-08-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f5e8d4a2c9b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add company_id column (nullable initially for backfill)
    op.add_column(
        "teams",
        sa.Column("company_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_teams_company_id",
        "teams",
        "companies",
        ["company_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "ix_teams_company_id",
        "teams",
        ["company_id"],
    )

    # Backfill existing teams to the default company
    op.execute("""
        UPDATE teams
        SET company_id = (
            SELECT id FROM companies WHERE slug = 'default-company' LIMIT 1
        )
        WHERE company_id IS NULL
    """)

    # Now make company_id NOT NULL
    op.alter_column("teams", "company_id", nullable=False)

    # Drop the old global unique constraint on name, add company-scoped unique
    op.drop_constraint("teams_name_key", "teams", type_="unique")
    op.create_unique_constraint(
        "uq_teams_company_name",
        "teams",
        ["company_id", "name"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_teams_company_name", "teams", type_="unique")
    op.create_unique_constraint("teams_name_key", "teams", ["name"])

    op.drop_index("ix_teams_company_id", table_name="teams")
    op.drop_constraint("fk_teams_company_id", "teams", type_="foreignkey")
    op.drop_column("teams", "company_id")
