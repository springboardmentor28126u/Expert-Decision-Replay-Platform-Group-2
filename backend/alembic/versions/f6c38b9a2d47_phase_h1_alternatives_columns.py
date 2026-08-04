"""phase H1: add missing alternatives columns

Revision ID: f6c38b9a2d47
Revises: 4a92c7e1d356
Create Date: 2026-08-04

Comparison against app.models.alternative.Alternative:

  - cost_estimate (Numeric 14,2): MISSING. Added, backfilled by exact
    cast from the legacy `cost` (float8) column. `cost` is kept, not
    dropped -- per your rule 4, float->numeric isn't a byte-identical
    supersession, just a more precise replacement, so the original is
    preserved rather than assumed equivalent.
  - risk_assessment (Text): MISSING. Added, backfilled verbatim as the
    text of the legacy `risk_level` enum label (LOW/MEDIUM/HIGH) --
    lossless, unambiguous, no judgment call. `risk_level` is kept.
  - feasibility_score (Integer): MISSING. Added, left NULL for all 4
    existing rows -- converting the legacy `feasibility` enum
    (LOW/MEDIUM/HIGH) to a specific integer scale is a judgment call
    with no established mapping (the model's own comment only says
    "e.g. 1-10 scale"), so nothing is fabricated. `feasibility` is kept.
  - is_selected (Boolean, NOT NULL default False): MISSING. Added.
  - created_by_id (UUID, FK -> users(id) RESTRICT): MISSING, and unlike
    every other *_id column converted so far, there is NO source data
    to backfill from -- the shared alternatives table never recorded a
    creator. The model declares this NOT NULL; added here as NULLABLE
    instead, a deliberate, flagged deviation rather than a fabricated
    owner. All 4 existing rows get NULL. Same category of gap as
    audit_logs.entity_id.
  - updated_at: did not exist at all (unlike users/decisions, which had
    a nullable column with some NULLs -- alternatives had no column
    whatsoever). Added directly as NOT NULL DEFAULT now() in one step,
    which backfills all 4 existing rows with the current timestamp and
    sets the default for future rows simultaneously.
  - is_deleted / deleted_at: MISSING. Added, matching every other
    soft-deletable table (is_deleted NOT NULL default false).

decision_id and alternatives.id are untouched here -- decision_id was
already fixed during the decisions phase; id (still integer) is
converted in H2/H3.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'f6c38b9a2d47'
down_revision: Union[str, None] = '4a92c7e1d356'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('alternatives', sa.Column('cost_estimate', sa.Numeric(14, 2), nullable=True))
    op.execute("UPDATE alternatives SET cost_estimate = cost::numeric(14,2)")

    op.add_column('alternatives', sa.Column('risk_assessment', sa.Text(), nullable=True))
    op.execute("UPDATE alternatives SET risk_assessment = risk_level::text")

    op.add_column('alternatives', sa.Column('feasibility_score', sa.Integer(), nullable=True))

    op.add_column('alternatives', sa.Column('is_selected', sa.Boolean(), nullable=False, server_default=sa.text('false')))

    op.add_column('alternatives', sa.Column('created_by_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index('ix_alternatives_created_by_id', 'alternatives', ['created_by_id'], unique=False)
    op.create_foreign_key('fk_alternatives_created_by_id_users', 'alternatives', 'users', ['created_by_id'], ['id'], ondelete='RESTRICT')

    op.add_column('alternatives', sa.Column(
        'updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')
    ))

    op.add_column('alternatives', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('alternatives', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('alternatives', 'deleted_at')
    op.drop_column('alternatives', 'is_deleted')
    op.drop_column('alternatives', 'updated_at')
    op.drop_constraint('fk_alternatives_created_by_id_users', 'alternatives', type_='foreignkey')
    op.drop_index('ix_alternatives_created_by_id', table_name='alternatives')
    op.drop_column('alternatives', 'created_by_id')
    op.drop_column('alternatives', 'is_selected')
    op.drop_column('alternatives', 'feasibility_score')
    op.drop_column('alternatives', 'risk_assessment')
    op.drop_column('alternatives', 'cost_estimate')
