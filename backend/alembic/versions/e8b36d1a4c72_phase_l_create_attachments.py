"""phase L: create attachments table

Revision ID: e8b36d1a4c72
Revises: d7a25c9f1b40
Create Date: 2026-08-04

Creates `attachments` exactly matching app.models.attachment.Attachment,
including the CHECK constraint enforcing exactly one owner
(decision_id / alternative_id / comment_id). No data migration step --
uploaded_files has 0 rows (confirmed live before writing this
migration), so there is nothing to map and nothing to fabricate.
uploaded_files is not touched or dropped.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'e8b36d1a4c72'
down_revision: Union[str, None] = 'd7a25c9f1b40'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'attachments',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('decision_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('alternative_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('comment_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('uploaded_by_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=1024), nullable=False),
        sa.Column('file_type', sa.String(length=100), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['decision_id'], ['decisions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['alternative_id'], ['alternatives.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['comment_id'], ['comments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id'], ondelete='RESTRICT'),
        sa.CheckConstraint(
            '(num_nonnulls(decision_id, alternative_id, comment_id) = 1)',
            name='ck_attachment_exactly_one_owner',
        ),
    )
    op.create_index('ix_attachments_decision_id', 'attachments', ['decision_id'], unique=False)
    op.create_index('ix_attachments_alternative_id', 'attachments', ['alternative_id'], unique=False)
    op.create_index('ix_attachments_comment_id', 'attachments', ['comment_id'], unique=False)
    op.create_index('ix_attachments_uploaded_by_id', 'attachments', ['uploaded_by_id'], unique=False)


def downgrade() -> None:
    op.drop_table('attachments')
