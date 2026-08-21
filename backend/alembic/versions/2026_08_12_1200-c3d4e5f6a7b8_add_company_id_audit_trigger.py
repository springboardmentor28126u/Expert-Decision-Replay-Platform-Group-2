"""Add company_id to audit_logs and create immutability trigger

Revision ID: 2026_08_12_1200_c3d4e5f6a7b8
Revises: 2026_08_12_1100_b2c3d4e5f6a7
Create Date: 2026-08-12 12:00:00.000000+00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "2026_08_12_1200_c3d4e5f6a7b8"
down_revision = "2026_08_12_1100_b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("audit_logs", sa.Column("company_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index("ix_audit_logs_company_id", "audit_logs", ["company_id"])
    op.create_foreign_key("fk_audit_logs_company", "audit_logs", "companies", ["company_id"], ["id"], ondelete="SET NULL")


def downgrade() -> None:
    op.drop_constraint("fk_audit_logs_company", "audit_logs", type_="foreignkey")
    op.drop_index("ix_audit_logs_company_id", table_name="audit_logs")
    op.drop_column("audit_logs", "company_id")
