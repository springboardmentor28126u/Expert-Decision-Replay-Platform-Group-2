"""phase J: create comments table, migrate discussion_messages into it

Revision ID: f3a8d6e2c951
Revises: e2b59c4d8f06
Create Date: 2026-08-04

Creates `comments` exactly matching app.models.comment.Comment, then
migrates all 28 discussion_messages rows into it -- deterministic
mapping, verified against live data before writing this migration:

    decision_id       <- decision_id        (already UUID, FK'd)
    author_id         <- user_id            (already UUID, FK'd)
    content           <- message
    is_meeting_note   <- message_type = 'meeting_note'
    created_at        <- created_at         (direct copy, both existed)
    updated_at        <- updated_at         (direct copy, both existed)
    parent_comment_id <- resolved in a second pass, via a self-join on
                         the legacy id, for the 5 rows where
                         message_type = 'reply' (100% correlated with
                         parent_id being non-null; verified 0 orphaned
                         parent_id references beforehand)
    alternative_id    <- NULL. No column in discussion_messages maps to
                         this -- left NULL, not inferred, per "do not
                         fabricate data."
    is_deleted        <- false. discussion_messages has no soft-delete
                         concept; every row present in the table today
                         is, structurally, not deleted.
    deleted_at        <- NULL

Two columns preserve information that has no home in the Comment model
rather than silently dropping it:

    legacy_discussion_message_id (int, nullable) -- the original
        discussion_messages.id, for traceability and exact
        row-by-row migration verification.
    legacy_attachment_url (varchar, nullable) -- 13 of 28 rows have a
        real attachment_url with no equivalent column in Comment.

discussion_messages is NOT touched or dropped -- it remains fully
intact as the safety net, per your explicit instruction, until a
future phase confirms every row migrated correctly and removes it
separately.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'f3a8d6e2c951'
down_revision: Union[str, None] = 'e2b59c4d8f06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'comments',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('decision_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('alternative_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('parent_comment_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('author_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_meeting_note', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        # -- legacy/provenance columns, not part of the model --
        sa.Column('legacy_discussion_message_id', sa.Integer(), nullable=True),
        sa.Column('legacy_attachment_url', sa.String(length=1024), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['decision_id'], ['decisions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['alternative_id'], ['alternatives.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_comment_id'], ['comments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='RESTRICT'),
    )
    op.create_index('ix_comments_decision_id', 'comments', ['decision_id'], unique=False)
    op.create_index('ix_comments_alternative_id', 'comments', ['alternative_id'], unique=False)
    op.create_index('ix_comments_parent_comment_id', 'comments', ['parent_comment_id'], unique=False)
    op.create_index('ix_comments_author_id', 'comments', ['author_id'], unique=False)
    op.create_index('ix_comments_legacy_discussion_message_id', 'comments', ['legacy_discussion_message_id'], unique=True)

    # --- pass 1: migrate every row, parent_comment_id deferred ---
    op.execute("""
        INSERT INTO comments (
            id, decision_id, alternative_id, parent_comment_id, author_id,
            content, is_meeting_note, created_at, updated_at,
            is_deleted, deleted_at,
            legacy_discussion_message_id, legacy_attachment_url
        )
        SELECT
            gen_random_uuid(), decision_id, NULL, NULL, user_id,
            message, (message_type = 'meeting_note'), created_at, updated_at,
            false, NULL,
            id, attachment_url
        FROM discussion_messages
    """)

    # --- pass 2: resolve parent_comment_id via legacy id self-join ---
    op.execute("""
        UPDATE comments child
        SET parent_comment_id = parent.id
        FROM discussion_messages dm_child
        JOIN discussion_messages dm_parent ON dm_parent.id = dm_child.parent_id
        JOIN comments parent ON parent.legacy_discussion_message_id = dm_parent.id
        WHERE child.legacy_discussion_message_id = dm_child.id
          AND dm_child.parent_id IS NOT NULL
    """)


def downgrade() -> None:
    op.drop_table('comments')
