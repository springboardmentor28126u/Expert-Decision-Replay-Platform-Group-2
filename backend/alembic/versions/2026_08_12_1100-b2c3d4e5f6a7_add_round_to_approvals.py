"""Add round column to approvals for resubmission history

Revision ID: 2026_08_12_1100_b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-12 11:00:00.000000+00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "2026_08_12_1100_b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("approvals", sa.Column("round", sa.Integer(), nullable=False, server_default="1"))

    op.drop_constraint("uq_approval_decision_level", "approvals", type_="unique")
    op.create_unique_constraint(
        "uq_approval_decision_level_round", "approvals",
        ["decision_id", "level", "round"]
    )
    op.create_index("ix_approvals_decision_round", "approvals", ["decision_id", "round"])

    op.alter_column("approvals", "round", server_default=None)


def downgrade() -> None:
    op.drop_index("ix_approvals_decision_round", table_name="approvals")
    op.drop_constraint("uq_approval_decision_level_round", "approvals", type_="unique")
    op.create_unique_constraint(
        "uq_approval_decision_level", "approvals",
        ["decision_id", "level"]
    )
    op.drop_column("approvals", "round")
