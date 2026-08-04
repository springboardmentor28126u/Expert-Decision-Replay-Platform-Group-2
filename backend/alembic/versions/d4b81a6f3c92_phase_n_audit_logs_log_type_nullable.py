"""phase N: make audit_logs.log_type nullable

Revision ID: d4b81a6f3c92
Revises: c3a70f5e2b86
Create Date: 2026-08-04

Fixes the final blocker: log_type (legacy column, no equivalent in
app.models.audit_log.AuditLog, deliberately kept rather than dropped
several phases ago -- same pattern as cost/risk_level/action elsewhere)
was still NOT NULL, but the ORM never supplies a value for a column it
doesn't know exists, so every INSERT through the app failed.

Checked for remaining consumers before choosing an approach: zero
references to log_type anywhere in backend/app (models, services,
repositories, schemas, routers) -- grep confirmed. Could not verify
there is no consumer entirely outside this codebase, so per your
explicit preference, chose the least destructive fix: made the column
nullable rather than dropping it. No default value was added either --
a fabricated default (e.g. 'unknown') would misrepresent rows the
current system never categorized; NULL honestly means "not set by
this system," matching every future app-created row.

The 30 existing rows' real log_type values (all originally populated)
are completely untouched -- this only loosens the constraint, it
doesn't rewrite any data.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd4b81a6f3c92'
down_revision: Union[str, None] = 'c3a70f5e2b86'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('audit_logs', 'log_type', nullable=True)


def downgrade() -> None:
    op.alter_column('audit_logs', 'log_type', nullable=False)
