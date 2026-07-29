"""add_decision_comments

Revision ID: b3c4d5e6f789
Revises: e4a2c8f1b903
Create Date: 2026-07-29 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b3c4d5e6f789"
down_revision: Union[str, None] = "e4a2c8f1b903"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "decision_comments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("decision_id", sa.UUID(), nullable=False),
        sa.Column("author_id", sa.UUID(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("parent_comment_id", sa.UUID(), nullable=True),
        sa.Column("is_edited", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["decision_id"], ["decisions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["parent_comment_id"], ["decision_comments.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_decision_comments_decision_id", "decision_comments", ["decision_id"], unique=False)
    op.create_index("ix_decision_comments_author_id", "decision_comments", ["author_id"], unique=False)
    op.create_index("ix_decision_comments_parent_comment_id", "decision_comments", ["parent_comment_id"], unique=False)
    op.create_index("ix_decision_comments_decision_created", "decision_comments", ["decision_id", "created_at"], unique=False)

    op.create_table(
        "decision_comment_likes",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("comment_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["comment_id"], ["decision_comments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("comment_id", "user_id", name="uq_decision_comment_user_like"),
    )
    op.create_index("ix_decision_comment_likes_comment_id", "decision_comment_likes", ["comment_id"], unique=False)
    op.create_index("ix_decision_comment_likes_user_id", "decision_comment_likes", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_decision_comment_likes_user_id", table_name="decision_comment_likes")
    op.drop_index("ix_decision_comment_likes_comment_id", table_name="decision_comment_likes")
    op.drop_table("decision_comment_likes")
    op.drop_index("ix_decision_comments_decision_created", table_name="decision_comments")
    op.drop_index("ix_decision_comments_parent_comment_id", table_name="decision_comments")
    op.drop_index("ix_decision_comments_author_id", table_name="decision_comments")
    op.drop_index("ix_decision_comments_decision_id", table_name="decision_comments")
    op.drop_table("decision_comments")
