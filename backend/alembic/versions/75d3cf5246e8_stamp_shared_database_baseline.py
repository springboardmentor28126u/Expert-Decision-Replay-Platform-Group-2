"""stamp shared database baseline

Revision ID: 75d3cf5246e8
Revises:
Create Date: 2026-08-04

Synthetic baseline marker for the shared team Neon database — NOT a
reconstruction of its real migration history (that history was never
committed to this repo; the shared DB was built independently).

This revision ID is not arbitrary: it is exactly the value already
present in the shared database's `alembic_version` table. Creating a
local script with this exact ID lets Alembic recognize it as a valid
ancestor node in the migration graph, so new migrations (starting with
Phase A) can be applied on top of the shared DB's actual current state
via `alembic upgrade`.

upgrade()/downgrade() are intentionally no-ops. This script must never
be relied on to build a fresh database from scratch — running it against
an empty database produces an empty database, not the shared DB's
legacy schema (integer PKs, discussion_messages, uploaded_files, etc.).
Only the already-migrated shared DB itself is meaningfully "at" this
revision.

This introduces a second root in the local migration graph, alongside
the existing 83f9966ec583 (this repo's original personal-dev-DB
history). From this point on, `alembic upgrade head` is ambiguous
without a target — use explicit revision IDs or branch labels
(`shared_legacy@head`) instead of the bare `head` keyword.
"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = '75d3cf5246e8'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = ('shared_legacy',)
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Intentionally empty — see module docstring.
    pass


def downgrade() -> None:
    # Intentionally empty — see module docstring.
    pass
