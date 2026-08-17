"""add ai_conversations and ai_messages tables (fresh_local branch)

Revision ID: 350414f2abda
Revises: 83f9966ec583
Create Date: 2026-08-17

This repo's migration graph has two independent roots (see
83f9966ec583_create_initial_schema.py's docstring): `fresh_local`
(bootstraps an empty database) and `shared_legacy` (reconciles the
pre-existing shared Neon DB). ai_conversations/ai_messages were added
once already — 9d589d0e77ac_add_ai_conversations_and_ai_messages.py,
chained onto c9a36f1e5d74 on the `shared_legacy` branch, and that
wiring is intentionally left exactly as it is.

That migration is unreachable from `fresh_local`, though — a database
bootstrapped via `alembic upgrade fresh_local@head` would never see it
and would end up missing both tables entirely. Rather than merge the
two branches (which would incorrectly imply a single database needs
history from both starting points at once) or move 9d589d0e77ac onto
this branch (breaking its existing, already-correct connection to
c9a36f1e5d74), this is a small sibling migration: identical
upgrade()/downgrade() to 9d589d0e77ac, chained onto 83f9966ec583
instead, so `fresh_local@head` also ends up with the tables.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '350414f2abda'
down_revision: Union[str, None] = '83f9966ec583'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'ai_conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_ai_conversations_user_id', 'ai_conversations', ['user_id'], unique=False)

    op.create_table(
        'ai_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('provider', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['conversation_id'], ['ai_conversations.id'], ondelete='CASCADE'),
        sa.CheckConstraint("role IN ('user', 'assistant')", name='ck_ai_messages_role'),
    )
    op.create_index('ix_ai_messages_conversation_id', 'ai_messages', ['conversation_id'], unique=False)


def downgrade() -> None:
    op.drop_table('ai_messages')
    op.drop_table('ai_conversations')
