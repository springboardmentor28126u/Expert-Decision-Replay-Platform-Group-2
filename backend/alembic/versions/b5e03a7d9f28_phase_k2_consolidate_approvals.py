"""phase K2: consolidate duplicate approval rows, add status/level/comments/decided_at/updated_at

Revision ID: b5e03a7d9f28
Revises: a4d92f6c8e17
Create Date: 2026-08-04

Second stage -- the live approvals table is now safe to consolidate,
since _legacy_approval_actions (Phase K1) already holds a verbatim
copy of all 32 rows.

1. Delete the 10 superseded duplicate rows from the LIVE table only
   (ids 7,8,9 / 1,2 / 3,4,5,6 / 12 -- the non-latest row in each of the
   4 duplicate groups identified in the migration plan, by MAX(created_at)
   within each (decision_id, stage, reviewer_id) group). Every one of
   these 10 rows remains permanently in _legacy_approval_actions.
2. rename stage -> level, comment -> comments (direct, same concept).
3. CREATE TYPE approval_status with UPPERCASE labels (PENDING, APPROVED,
   REJECTED, ESCALATED) -- same reasoning as decision_status: this
   model doesn't set values_callable, so SQLAlchemy serializes by enum
   member NAME, not .value.
4. Add status, backfill from action (approved->APPROVED,
   rejected->REJECTED, resubmitted->PENDING -- resolved several phases
   ago: a resubmission is an unresolved/reopened review, closest true
   meaning to PENDING). `action` is kept, not dropped -- not fully
   superseded, matches how cost/risk_level/log_type were preserved
   elsewhere.
5. Add decided_at = created_at where status is terminal (APPROVED/
   REJECTED), NULL where PENDING -- this row's own created_at IS the
   moment that decision was recorded, not an inference.
6. Add updated_at (NOT NULL DEFAULT now(), same one-step pattern as
   alternatives/decision_versions -- the column didn't exist at all).
7. Add the model's unique constraint on (decision_id, level,
   reviewer_id) -- verified to succeed since consolidation already
   removed every duplicate.

approvals.id (still integer) is untouched here -- staged conversion is
K3/K4.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b5e03a7d9f28'
down_revision: Union[str, None] = 'a4d92f6c8e17'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# the 10 superseded rows -- every id NOT the max-created_at row in its
# duplicate group, determined directly from the discovery query above
_SUPERSEDED_IDS = [7, 8, 9, 1, 2, 3, 4, 5, 6, 12]


def upgrade() -> None:
    op.execute(f"DELETE FROM approvals WHERE id IN ({','.join(str(i) for i in _SUPERSEDED_IDS)})")

    op.alter_column('approvals', 'stage', new_column_name='level')
    op.alter_column('approvals', 'comment', new_column_name='comments')

    op.execute("CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED')")
    op.execute("ALTER TABLE approvals ADD COLUMN status approval_status")
    op.execute("""
        UPDATE approvals SET status = CASE action::text
            WHEN 'approved' THEN 'APPROVED'
            WHEN 'rejected' THEN 'REJECTED'
            WHEN 'resubmitted' THEN 'PENDING'
        END::approval_status
    """)
    op.alter_column('approvals', 'status', nullable=False)
    op.create_index('ix_approvals_status', 'approvals', ['status'], unique=False)

    op.add_column('approvals', sa.Column('decided_at', sa.DateTime(timezone=True), nullable=True))
    op.execute("""
        UPDATE approvals SET decided_at = created_at
        WHERE status IN ('APPROVED', 'REJECTED')
    """)

    op.add_column('approvals', sa.Column(
        'updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')
    ))

    op.create_unique_constraint(
        'uq_approval_decision_level_reviewer', 'approvals', ['decision_id', 'level', 'reviewer_id']
    )
    op.create_index('ix_approvals_level', 'approvals', ['level'], unique=False)


def downgrade() -> None:
    raise NotImplementedError(
        "Downgrading past the approvals consolidation is not supported -- "
        "10 rows were removed from the live table (preserved in "
        "_legacy_approval_actions). Restore from a pre-K2 snapshot/branch, "
        "or manually re-insert from the archive table, instead."
    )
