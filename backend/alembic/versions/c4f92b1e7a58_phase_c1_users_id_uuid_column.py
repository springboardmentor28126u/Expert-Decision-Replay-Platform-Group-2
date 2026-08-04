"""phase C1: add users.id_uuid, populate, unique constraint

Revision ID: c4f92b1e7a58
Revises: b2d8e4f61a37
Create Date: 2026-08-04

First stage of the users primary-key conversion (int -> UUID). Adds a
parallel id_uuid column, explicitly backfills every existing row with
a freshly generated UUID (explicit UPDATE, not a column DEFAULT, so
there's no ambiguity about whether each of the 21 rows gets a distinct
value), then constrains it UNIQUE -- not yet PRIMARY KEY. This UNIQUE
constraint is what lets Phase C2 attach real, enforced foreign keys to
this column before anything is promoted.

The old integer `id` column, its sequence, and its PRIMARY KEY
constraint are completely untouched here. Every existing user's old id
still works exactly as before; this migration is invisible to any
query that doesn't reference id_uuid.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c4f92b1e7a58'
down_revision: Union[str, None] = 'b2d8e4f61a37'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('id_uuid', postgresql.UUID(as_uuid=True), nullable=True))
    op.execute("UPDATE users SET id_uuid = gen_random_uuid()")
    op.alter_column('users', 'id_uuid', nullable=False)
    op.create_unique_constraint('uq_users_id_uuid', 'users', ['id_uuid'])


def downgrade() -> None:
    op.drop_constraint('uq_users_id_uuid', 'users', type_='unique')
    op.drop_column('users', 'id_uuid')
