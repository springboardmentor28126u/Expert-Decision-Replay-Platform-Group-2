"""phase I1: add missing decision_versions columns, convert status to native enum

Revision ID: c9f47a2e5b81
Revises: b4e92f7a5d13
Create Date: 2026-08-04

Comparison against app.models.decision_version.DecisionVersion:

  - decision_rationale (Text, nullable): MISSING. Added, left NULL for
    all 19 existing rows -- no source data to derive it from, and
    per your rules 5/6, nothing is fabricated or inferred.
  - updated_at: did not exist at all (same situation as alternatives).
    Added directly as NOT NULL DEFAULT now(), backfilling all 19
    existing rows with the current timestamp in the same step.
  - status: existing column, but varchar, not the native decision_status
    enum. All 4 distinct live values (archived, draft, rejected,
    under_review) are lowercase and map 1:1 onto the enum's labels,
    which are now uppercase after the earlier decisions phase
    (ALTER TYPE ... RENAME VALUE). Converted in place with
    `ALTER COLUMN status TYPE decision_status USING UPPER(status)::decision_status`
    -- a mechanical, unambiguous case transform of existing values,
    not a fabrication: every live value has exactly one valid target
    label, verified before writing this migration.

No legacy/model-compatible column duplication needed here (unlike
alternatives' cost/risk_level) -- status is one column serving one
purpose throughout; converting its type in place is the direct,
minimal fix, consistent with how decisions.status's type-name (not
value) mismatch was handled.

decision_id and changed_by_id are untouched -- both were already
correct (added incidentally during the users/decisions FK cascades).
decision_versions.id (still integer) is converted in I2/I3. No other
table is touched -- discovery confirmed zero FKs reference
decision_versions(id).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c9f47a2e5b81'
down_revision: Union[str, None] = 'b4e92f7a5d13'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('decision_versions', sa.Column('decision_rationale', sa.Text(), nullable=True))

    op.add_column('decision_versions', sa.Column(
        'updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')
    ))

    op.execute(
        "ALTER TABLE decision_versions "
        "ALTER COLUMN status TYPE decision_status USING UPPER(status)::decision_status"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE decision_versions ALTER COLUMN status TYPE varchar USING LOWER(status::text)")
    op.drop_column('decision_versions', 'updated_at')
    op.drop_column('decision_versions', 'decision_rationale')
