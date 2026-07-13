"""create initial schema (roles, teams, users, refresh_tokens, decisions,
alternatives, comments, approvals, attachments, notifications, audit_logs)

Revision ID: 202607091200
Revises:
Create Date: 2026-07-09 12:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "202607091200"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # UUIDPrimaryKeyMixin's server_default uses gen_random_uuid(), which
    # requires pgcrypto. Must run before any table using that default.
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    # --- roles ------------------------------------------------------
    op.create_table(
        "roles",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_roles_name", "roles", ["name"])

    # --- teams (manager_id FK added later, once users exists) -------
    op.create_table(
        "teams",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("manager_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_teams_name", "teams", ["name"])
    op.create_index("ix_teams_manager_id", "teams", ["manager_id"])

    # --- users --------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("team_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_role_id", "users", ["role_id"])
    op.create_index("ix_users_team_id", "users", ["team_id"])

    # --- close the teams <-> users FK cycle --------------------------
    op.create_foreign_key(
        "fk_teams_manager_id_users", "teams", "users", ["manager_id"], ["id"], ondelete="SET NULL"
    )

    # --- refresh_tokens -----------------------------------------------
    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("jti", sa.String(length=36), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
        sa.UniqueConstraint("jti"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"])
    op.create_index("ix_refresh_tokens_jti", "refresh_tokens", ["jti"])

    # --- decisions ------------------------------------------------------
    # create_type=False: we create the type explicitly below, so the
    # column definition must NOT try to auto-create it again during
    # create_table (that auto-create doesn't check-first and blows up
    # with DuplicateObjectError if the type already exists).
    decision_status = postgresql.ENUM(
        "draft", "under_review", "approved", "rejected", "archived",
        name="decision_status",
        create_type=False,
    )
    decision_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "decisions",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("problem_statement", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("decision_rationale", sa.Text(), nullable=True),
        sa.Column("status", decision_status, server_default="draft", nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("team_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_decisions_title", "decisions", ["title"])
    op.create_index("ix_decisions_category", "decisions", ["category"])
    op.create_index("ix_decisions_status", "decisions", ["status"])
    op.create_index("ix_decisions_created_by_id", "decisions", ["created_by_id"])
    op.create_index("ix_decisions_team_id", "decisions", ["team_id"])

    # --- alternatives -----------------------------------------------
    op.create_table(
        "alternatives",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("pros", sa.Text(), nullable=True),
        sa.Column("cons", sa.Text(), nullable=True),
        sa.Column("cost_estimate", sa.Numeric(14, 2), nullable=True),
        sa.Column("feasibility_score", sa.Integer(), nullable=True),
        sa.Column("risk_assessment", sa.Text(), nullable=True),
        sa.Column("is_selected", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["decision_id"], ["decisions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_alternatives_decision_id", "alternatives", ["decision_id"])
    op.create_index("ix_alternatives_created_by_id", "alternatives", ["created_by_id"])

    # --- comments -------------------------------------------------------
    op.create_table(
        "comments",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("alternative_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("parent_comment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_meeting_note", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["decision_id"], ["decisions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["alternative_id"], ["alternatives.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parent_comment_id"], ["comments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_comments_decision_id", "comments", ["decision_id"])
    op.create_index("ix_comments_alternative_id", "comments", ["alternative_id"])
    op.create_index("ix_comments_parent_comment_id", "comments", ["parent_comment_id"])
    op.create_index("ix_comments_author_id", "comments", ["author_id"])

    # --- approvals ------------------------------------------------------
    approval_status = postgresql.ENUM(
        "pending", "approved", "rejected", "escalated",
        name="approval_status",
        create_type=False,
    )
    approval_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "approvals",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reviewer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("status", approval_status, server_default="pending", nullable=False),
        sa.Column("comments", sa.Text(), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["decision_id"], ["decisions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewer_id"], ["users.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("decision_id", "level", "reviewer_id", name="uq_approval_decision_level_reviewer"),
    )
    op.create_index("ix_approvals_decision_id", "approvals", ["decision_id"])
    op.create_index("ix_approvals_reviewer_id", "approvals", ["reviewer_id"])
    op.create_index("ix_approvals_status", "approvals", ["status"])

    # --- attachments ------------------------------------------------
    op.create_table(
        "attachments",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("alternative_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("comment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("uploaded_by_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=1024), nullable=False),
        sa.Column("file_type", sa.String(length=100), nullable=False),
        sa.Column("file_size", sa.BigInteger(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["decision_id"], ["decisions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["alternative_id"], ["alternatives.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["comment_id"], ["comments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by_id"], ["users.id"], ondelete="RESTRICT"),
        sa.CheckConstraint(
            "(num_nonnulls(decision_id, alternative_id, comment_id) = 1)",
            name="ck_attachment_exactly_one_owner",
        ),
    )
    op.create_index("ix_attachments_decision_id", "attachments", ["decision_id"])
    op.create_index("ix_attachments_alternative_id", "attachments", ["alternative_id"])
    op.create_index("ix_attachments_comment_id", "attachments", ["comment_id"])
    op.create_index("ix_attachments_uploaded_by_id", "attachments", ["uploaded_by_id"])

    # --- notifications ----------------------------------------------
    notification_type = postgresql.ENUM(
        "approval_request", "approval_decision", "comment_mention",
        "decision_status_change", "escalation", "system",
        name="notification_type",
        create_type=False,
    )
    notification_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("recipient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", notification_type, nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("related_entity_type", sa.String(length=50), nullable=False),
        sa.Column("related_entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["recipient_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_notifications_recipient_id", "notifications", ["recipient_id"])
    op.create_index("ix_notifications_type", "notifications", ["type"])
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"])

    # --- audit_logs -----------------------------------------------------
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("log_metadata", postgresql.JSONB(), nullable=True),
        sa.Column("ip_address", postgresql.INET(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_audit_logs_actor_id", "audit_logs", ["actor_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_entity_type", "audit_logs", ["entity_type"])
    op.create_index("ix_audit_logs_entity_id", "audit_logs", ["entity_id"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])


def downgrade() -> None:
    # Reverse dependency order — children before parents.
    op.drop_table("audit_logs")
    op.drop_table("notifications")
    op.execute("DROP TYPE IF EXISTS notification_type")
    op.drop_table("attachments")
    op.drop_table("approvals")
    op.execute("DROP TYPE IF EXISTS approval_status")
    op.drop_table("comments")
    op.drop_table("alternatives")
    op.drop_table("decisions")
    op.execute("DROP TYPE IF EXISTS decision_status")
    op.drop_table("refresh_tokens")
    op.drop_constraint("fk_teams_manager_id_users", "teams", type_="foreignkey")
    op.drop_table("users")
    op.drop_table("teams")
    op.drop_table("roles")