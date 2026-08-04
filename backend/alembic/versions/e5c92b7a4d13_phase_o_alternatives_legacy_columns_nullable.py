"""phase O: make alternatives.risk_level and feasibility nullable

Revision ID: e5c92b7a4d13
Revises: d4b81a6f3c92
Create Date: 2026-08-04

Same pattern as users.role and audit_logs.log_type: risk_level and
feasibility (legacy enum columns, kept alongside the new
risk_assessment/feasibility_score during the Alternatives phase) are
still NOT NULL. The Alternative model has no attribute for either, so
the ORM never supplies them, blocking every INSERT. Least destructive
fix per your standing instruction: drop the NOT NULL constraint, no
fabricated default. All 4 existing rows' real values untouched.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'e5c92b7a4d13'
down_revision: Union[str, None] = 'd4b81a6f3c92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('alternatives', 'risk_level', nullable=True)
    op.alter_column('alternatives', 'feasibility', nullable=True)


def downgrade() -> None:
    op.alter_column('alternatives', 'feasibility', nullable=False)
    op.alter_column('alternatives', 'risk_level', nullable=False)
