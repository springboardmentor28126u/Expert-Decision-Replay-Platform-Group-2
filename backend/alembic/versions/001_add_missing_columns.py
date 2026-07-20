"""Add missing columns and file_attachments table.

Revision ID: 001_add_missing_columns
Revises: None
Create Date: 2026-07-20

This migration adds columns needed for Milestone 2 features:
- alternatives: pros, cons, feasibility
- discussions: parent_id, type
- decision_history: changed_fields (JSONB)
- NEW TABLE: file_attachments
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "001_add_missing_columns"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add new columns and create file_attachments table."""

    # --- alternatives table: add pros, cons, feasibility ---
    op.add_column("alternatives", sa.Column("pros", sa.Text(), nullable=True))
    op.add_column("alternatives", sa.Column("cons", sa.Text(), nullable=True))
    op.add_column("alternatives", sa.Column("feasibility", sa.Integer(), nullable=True))

    # --- discussions table: add parent_id (self-referencing FK), type ---
    op.add_column("discussions", sa.Column("parent_id", sa.Integer(), nullable=True))
    op.add_column("discussions", sa.Column("type", sa.String(), nullable=True, server_default="comment"))
    op.create_foreign_key(
        "fk_discussions_parent_id",
        "discussions",
        "discussions",
        ["parent_id"],
        ["id"],
    )

    # --- decision_history table: add changed_fields JSONB ---
    op.add_column("decision_history", sa.Column("changed_fields", JSONB(), nullable=True))

    # --- NEW: file_attachments table ---
    op.create_table(
        "file_attachments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("decision_id", sa.Integer(), sa.ForeignKey("decisions.id"), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("filepath", sa.String(), nullable=False),
        sa.Column("content_type", sa.String(), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=True),
        sa.Column("uploaded_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_file_attachments_id", "file_attachments", ["id"])
    op.create_index("ix_file_attachments_decision_id", "file_attachments", ["decision_id"])


def downgrade() -> None:
    """Reverse the migration (remove added columns and table)."""
    op.drop_index("ix_file_attachments_decision_id", table_name="file_attachments")
    op.drop_index("ix_file_attachments_id", table_name="file_attachments")
    op.drop_table("file_attachments")

    op.drop_column("decision_history", "changed_fields")

    op.drop_constraint("fk_discussions_parent_id", "discussions", type_="foreignkey")
    op.drop_column("discussions", "type")
    op.drop_column("discussions", "parent_id")

    op.drop_column("alternatives", "feasibility")
    op.drop_column("alternatives", "cons")
    op.drop_column("alternatives", "pros")
