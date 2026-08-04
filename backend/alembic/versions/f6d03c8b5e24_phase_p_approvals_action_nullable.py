"""phase P: make approvals.action nullable

Revision ID: f6d03c8b5e24
Revises: e5c92b7a4d13
Create Date: 2026-08-04

Same pattern as users.role, audit_logs.log_type, alternatives.risk_level/
feasibility: action (legacy column, kept for traceability during the
Approvals consolidation phase, no Approval model attribute) is still
NOT NULL, blocking every INSERT the ORM makes. Least destructive fix:
drop NOT NULL, no fabricated default. All 22 existing rows' real
action values untouched.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'f6d03c8b5e24'
down_revision: Union[str, None] = 'e5c92b7a4d13'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('approvals', 'action', nullable=True)


def downgrade() -> None:
    op.alter_column('approvals', 'action', nullable=False)
