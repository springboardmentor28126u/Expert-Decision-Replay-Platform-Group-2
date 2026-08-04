"""phase K1: archive every legacy approval action, verbatim, before touching the live table

Revision ID: a4d92f6c8e17
Revises: f3a8d6e2c951
Create Date: 2026-08-04

Creates _legacy_approval_actions and copies all 32 current approvals
rows into it exactly as they are, with no transformation at all. This
is the safety net required by your rules 5-8: nothing in the live
approvals table is touched, deduplicated, or reshaped until this
archive exists and this migration has committed.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a4d92f6c8e17'
down_revision: Union[str, None] = 'f3a8d6e2c951'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE _legacy_approval_actions (
            id integer,
            decision_id uuid,
            reviewer_id uuid,
            stage integer,
            action approvalaction,
            comment text,
            created_at timestamptz,
            archived_at timestamptz NOT NULL DEFAULT now()
        )
    """)
    op.execute("""
        INSERT INTO _legacy_approval_actions
            (id, decision_id, reviewer_id, stage, action, comment, created_at)
        SELECT id, decision_id, reviewer_id, stage, action, comment, created_at
        FROM approvals
    """)


def downgrade() -> None:
    op.execute("DROP TABLE _legacy_approval_actions")
