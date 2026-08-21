"""rebuild_approval_chain_configs

Rebuilds approval_chain_configs with the multi-tenant model shape:
company_id (required), optional group_id, free-text category, ordered
levels JSONB, SLA hours, and a company+group+category unique constraint.
Also adds a partial unique index so company-wide configs (group_id IS NULL)
cannot be duplicated — PostgreSQL UNIQUE treats NULLs as distinct.

Revision ID: f5e8d4a2c9b1
Revises: b3c4d5e6f789
Create Date: 2026-07-31 14:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "f5e8d4a2c9b1"
down_revision: Union[str, None] = "b3c4d5e6f789"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table("approval_chain_configs")

    op.create_table(
        "approval_chain_configs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("group_id", sa.UUID(), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("levels", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("sla_hours", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "company_id", "group_id", "category",
            name="uq_chain_company_group_category",
        ),
    )
    op.create_index(
        "ix_approval_chain_configs_company_id",
        "approval_chain_configs",
        ["company_id"],
    )
    op.create_index(
        "ix_approval_chain_configs_group_id",
        "approval_chain_configs",
        ["group_id"],
    )
    op.create_index(
        "uq_chain_company_category_default",
        "approval_chain_configs",
        ["company_id", "category"],
        unique=True,
        postgresql_where=sa.text("group_id IS NULL"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_chain_company_category_default",
        table_name="approval_chain_configs",
    )
    op.drop_index(
        "ix_approval_chain_configs_group_id",
        table_name="approval_chain_configs",
    )
    op.drop_index(
        "ix_approval_chain_configs_company_id",
        table_name="approval_chain_configs",
    )
    op.drop_table("approval_chain_configs")

    op.create_table(
        "approval_chain_configs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("category_id", sa.UUID(), nullable=False),
        sa.Column("roles", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("sla_hours", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["decision_categories.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("category_id"),
    )
