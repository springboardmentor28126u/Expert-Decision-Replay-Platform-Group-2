"""phase F1: add missing decisions columns, backfill updated_at, rename status enum

Revision ID: b3e07d5a19c4
Revises: a91d6f2c4e83
Create Date: 2026-08-04

First stage of decisions compatibility. Fresh comparison against
app.models.decision.Decision showed created_by_id and
assigned_reviewer_id were already added (incidentally, as part of the
users FK cascade in Phase C2/C3) -- not touched again here. Remaining
gaps, all purely additive:

  - decision_rationale (Text, nullable): MISSING, added.
  - version (Integer, NOT NULL, model default 1): MISSING, added with
    server_default '1' so all 30 existing rows get a valid value with
    no separate backfill step.
  - team_id (UUID, nullable, FK -> teams(id) SET NULL): MISSING, added
    WITH its FK immediately -- teams.id is already UUID (Phase A), no
    staging needed. teams has 0 rows, so nothing to backfill.
  - is_deleted / deleted_at: MISSING, added (is_deleted NOT NULL
    default false, matching every other soft-deletable table in this
    migration series).
  - updated_at: exists but nullable, no default, 13 of 30 rows NULL.
    Backfilled from created_at (verified non-null for all 13 affected
    rows), then tightened to NOT NULL with server_default now(),
    matching TimestampMixin -- same pattern as the users cleanup phase.
  - status enum: shared's type is named `decisionstatus`, model expects
    `decision_status`. Values are identical (draft/under_review/
    approved/rejected/archived, confirmed against live data) -- this is
    a pure catalog rename, zero data risk, not a value conversion.

decisions.id itself is NOT touched here -- that's F2-F4, staged exactly
like the users PK conversion. No other table is touched.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b3e07d5a19c4'
down_revision: Union[str, None] = 'a91d6f2c4e83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('decisions', sa.Column('decision_rationale', sa.Text(), nullable=True))
    op.add_column('decisions', sa.Column('version', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('decisions', sa.Column('team_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('decisions', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('decisions', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))

    op.create_index('ix_decisions_team_id', 'decisions', ['team_id'], unique=False)
    op.create_foreign_key('fk_decisions_team_id_teams', 'decisions', 'teams', ['team_id'], ['id'], ondelete='SET NULL')

    op.execute("UPDATE decisions SET updated_at = created_at WHERE updated_at IS NULL")
    op.alter_column('decisions', 'updated_at', server_default=sa.text('now()'))
    op.alter_column('decisions', 'updated_at', nullable=False)

    op.execute("ALTER TYPE decisionstatus RENAME TO decision_status")


def downgrade() -> None:
    op.execute("ALTER TYPE decision_status RENAME TO decisionstatus")
    op.alter_column('decisions', 'updated_at', nullable=True)
    op.alter_column('decisions', 'updated_at', server_default=None)
    op.drop_constraint('fk_decisions_team_id_teams', 'decisions', type_='foreignkey')
    op.drop_index('ix_decisions_team_id', table_name='decisions')
    op.drop_column('decisions', 'deleted_at')
    op.drop_column('decisions', 'is_deleted')
    op.drop_column('decisions', 'team_id')
    op.drop_column('decisions', 'version')
    op.drop_column('decisions', 'decision_rationale')
