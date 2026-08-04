"""phase G: convert decision_status enum labels to uppercase

Revision ID: 4a92c7e1d356
Revises: e5b83f1a4d92
Create Date: 2026-08-04

Fixes the CRUD blocker found in the decisions phase: SQLAlchemy's
native Enum column, without values_callable configured (which
app.models.decision.Decision does not set), serializes using the
Python enum member NAME ("DRAFT"), not its .value ("draft"). The
original canonical migration (83f9966ec583) created decision_status
with uppercase labels for exactly this reason; the shared DB's type
had lowercase ones -- a real label mismatch, not just the type-name
mismatch fixed in the earlier decisions phase.

Uses ALTER TYPE ... RENAME VALUE -- the standard, built-in Postgres
mechanism for this exact situation. It renames the label in the
pg_enum catalog only; every existing decisions.status value is
automatically read under its new label, with no UPDATE, no table
rewrite, and no change to the decisions table itself. All 30 existing
rows keep their semantic meaning exactly:

    draft -> DRAFT, under_review -> UNDER_REVIEW, approved -> APPROVED,
    rejected -> REJECTED, archived -> ARCHIVED

Only the decision_status type is touched. No table, including
decisions, is altered.
"""
from typing import Sequence, Union

from alembic import op

revision: str = '4a92c7e1d356'
down_revision: Union[str, None] = 'e5b83f1a4d92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_RENAMES = [
    ('draft', 'DRAFT'),
    ('under_review', 'UNDER_REVIEW'),
    ('approved', 'APPROVED'),
    ('rejected', 'REJECTED'),
    ('archived', 'ARCHIVED'),
]


def upgrade() -> None:
    for old, new in _RENAMES:
        op.execute(f"ALTER TYPE decision_status RENAME VALUE '{old}' TO '{new}'")


def downgrade() -> None:
    for old, new in _RENAMES:
        op.execute(f"ALTER TYPE decision_status RENAME VALUE '{new}' TO '{old}'")
