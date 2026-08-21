"""
add_audit_indexes_and_approval_action

Revision ID: h8i9j0k1l2m3
Revises: 2026_08_12_1600
Create Date: 2026-08-12 17:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "h8i9j0k1l2m3"
down_revision = "2026_08_12_1600"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # FIX-11: Add index on audit_logs.performed_by
    op.create_index(
        "ix_audit_logs_performed_by",
        "audit_logs",
        ["performed_by"],
        unique=False,
    )

    # FIX-12: Add index on decisions.created_by
    op.create_index(
        "ix_decisions_created_by",
        "decisions",
        ["created_by"],
        unique=False,
    )

    # FIX-4: Add action column to approvals
    op.add_column(
        "approvals",
        sa.Column("action", sa.String(30), nullable=True),
    )
    op.create_index(
        "ix_approvals_action",
        "approvals",
        ["action"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_approvals_action", table_name="approvals")
    op.drop_column("approvals", "action")
    op.drop_index("ix_decisions_created_by", table_name="decisions")
    op.drop_index("ix_audit_logs_performed_by", table_name="audit_logs")
