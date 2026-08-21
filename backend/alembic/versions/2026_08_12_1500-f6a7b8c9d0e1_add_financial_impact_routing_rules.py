"""Add financial_impact, risk_score, and approval_routing_rules

Revision ID: 2026_08_12_1500_f6a7b8c9d0e1
Revises: 2026_08_12_1400_e5f6a7b8c9d0
Create Date: 2026-08-12 15:00:00.000000+00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "2026_08_12_1500_f6a7b8c9d0e1"
down_revision = "2026_08_12_1400_e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("decisions", sa.Column("financial_impact", sa.Numeric(12, 2), nullable=True))
    op.add_column("decisions", sa.Column("risk_score", sa.Integer(), nullable=True))

    op.create_table(
        "approval_routing_rules",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", UUID(as_uuid=True), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("condition_field", sa.String(50), nullable=False),
        sa.Column("condition_operator", sa.String(20), nullable=False),
        sa.Column("condition_value", sa.String(255), nullable=False),
        sa.Column("insert_at_level", sa.Integer(), nullable=False),
        sa.Column("insert_position", sa.String(20), nullable=False, server_default="before"),
        sa.Column("target_role", sa.String(50), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_routing_rules_company", "approval_routing_rules", ["company_id"])


def downgrade() -> None:
    op.drop_index("ix_routing_rules_company", table_name="approval_routing_rules")
    op.drop_table("approval_routing_rules")
    op.drop_column("decisions", "risk_score")
    op.drop_column("decisions", "financial_impact")
