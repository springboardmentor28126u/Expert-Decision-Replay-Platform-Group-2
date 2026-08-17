"""add ai_conversations and ai_messages tables

Revision ID: 9d589d0e77ac
Revises: c9a36f1e5d74
Create Date: 2026-08-17

Creates ai_conversations and ai_messages exactly matching
app.models.ai_conversation.AIConversation and
app.models.ai_message.AIMessage — persistent, server-owned AI
assistant conversation history (Phase 4). ai_messages.role is
constrained to exactly 'user'/'assistant' at the database level; there
is no 'system' value, by design.

Chains onto c9a36f1e5d74 (phase Q3 — promote notifications uuid pk),
the tip of this repo's `shared_legacy` migration branch (see
75d3cf5246e8_stamp_shared_database_baseline.py) — left wired here
exactly as originally written.

This repo's migration graph has two independent roots, `shared_legacy`
and `fresh_local` (see 83f9966ec583_create_initial_schema.py's
docstring for the full explanation) — the bare `head` keyword is
ambiguous between them, so anything applying migrations in this repo
needs an explicit target: `shared_legacy@head` or `fresh_local@head`.
ai_conversations/ai_messages exist on `fresh_local` too, via a
separate sibling migration
(350414f2abda_add_ai_conversations_and_ai_messages_.py, chained onto
83f9966ec583 directly) — see that file for why this one wasn't simply
moved or dual-parented instead.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '9d589d0e77ac'
down_revision: Union[str, None] = 'c9a36f1e5d74'
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
