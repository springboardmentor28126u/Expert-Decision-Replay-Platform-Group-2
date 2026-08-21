"""add_group_join_requests

Revision ID: d8f1b5a7c901
Revises: a1b2c3d4e5f6
Create Date: 2026-07-28 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "d8f1b5a7c901"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    join_request_status = postgresql.ENUM(
        "pending",
        "accepted",
        "rejected",
        name="group_join_request_status",
    )
    join_request_status.create(op.get_bind(), checkfirst=True)

    op.add_column("groups", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("groups", sa.Column("owner_id", sa.UUID(), nullable=True))
    op.add_column(
        "groups",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )

    op.execute(
        """
        UPDATE groups AS g
        SET owner_id = COALESCE(
            (
                SELECT m.user_id
                FROM memberships AS m
                WHERE m.company_id = g.company_id AND m.role = 'ADMIN'
                ORDER BY m.created_at
                LIMIT 1
            ),
            (
                SELECT gm.user_id
                FROM group_memberships AS gm
                WHERE gm.group_id = g.id
                ORDER BY gm.created_at
                LIMIT 1
            ),
            (
                SELECT u.id
                FROM users AS u
                ORDER BY u.created_at
                LIMIT 1
            )
        )
        WHERE owner_id IS NULL
        """
    )
    op.alter_column("groups", "owner_id", nullable=False)
    op.create_foreign_key("fk_groups_owner_id", "groups", "users", ["owner_id"], ["id"])
    op.create_index(op.f("ix_groups_owner_id"), "groups", ["owner_id"], unique=False)

    op.add_column(
        "group_memberships",
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.add_column(
        "group_memberships",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
    )

    op.create_table(
        "group_join_requests",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("group_id", sa.UUID(), nullable=False),
        sa.Column("requested_by", sa.UUID(), nullable=False),
        sa.Column("requested_to", sa.UUID(), nullable=False),
        sa.Column("status", join_request_status, nullable=False, server_default="pending"),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("decided_by", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["decided_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["requested_by"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["requested_to"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_group_join_requests_group_id"), "group_join_requests", ["group_id"], unique=False)
    op.create_index(op.f("ix_group_join_requests_requested_by"), "group_join_requests", ["requested_by"], unique=False)
    op.create_index(op.f("ix_group_join_requests_requested_to"), "group_join_requests", ["requested_to"], unique=False)
    op.create_index(op.f("ix_group_join_requests_status"), "group_join_requests", ["status"], unique=False)
    op.create_index(
        "uq_group_join_requests_pending",
        "group_join_requests",
        ["group_id", "requested_by"],
        unique=True,
        postgresql_where=sa.text("status = 'pending'"),
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_type"), "notifications", ["type"], unique=False)
    op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_notifications_user_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_type"), table_name="notifications")
    op.drop_table("notifications")

    op.drop_index("uq_group_join_requests_pending", table_name="group_join_requests")
    op.drop_index(op.f("ix_group_join_requests_status"), table_name="group_join_requests")
    op.drop_index(op.f("ix_group_join_requests_requested_to"), table_name="group_join_requests")
    op.drop_index(op.f("ix_group_join_requests_requested_by"), table_name="group_join_requests")
    op.drop_index(op.f("ix_group_join_requests_group_id"), table_name="group_join_requests")
    op.drop_table("group_join_requests")

    op.drop_column("group_memberships", "is_active")
    op.drop_column("group_memberships", "joined_at")

    op.drop_index(op.f("ix_groups_owner_id"), table_name="groups")
    op.drop_constraint("fk_groups_owner_id", "groups", type_="foreignkey")
    op.drop_column("groups", "updated_at")
    op.drop_column("groups", "owner_id")
    op.drop_column("groups", "description")

    postgresql.ENUM(name="group_join_request_status").drop(op.get_bind(), checkfirst=True)
