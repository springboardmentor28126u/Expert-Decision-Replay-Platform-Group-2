"""Add performance indexes

Revision ID: 2026_08_12_1400_e5f6a7b8c9d0
Revises: 2026_08_12_1300_d4e5f6a7b8c9
Create Date: 2026-08-12 14:00:00.000000+00:00
"""
from alembic import op

revision = "2026_08_12_1400_e5f6a7b8c9d0"
down_revision = "2026_08_12_1300_d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_decisions_company_group", "decisions", ["company_id", "group_id"])
    op.create_index("ix_approvals_approver_id", "approvals", ["approver_id"])


def downgrade() -> None:
    op.drop_index("ix_approvals_approver_id", table_name="approvals")
    op.drop_index("ix_decisions_company_group", table_name="decisions")
