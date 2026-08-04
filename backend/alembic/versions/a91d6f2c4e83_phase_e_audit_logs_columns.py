"""phase E: add missing audit_logs columns (log_metadata, ip_address)

Revision ID: a91d6f2c4e83
Revises: f7c25e8b3a91
Create Date: 2026-08-04

Fixes the reported blocker: UndefinedColumnError on audit_logs.log_metadata.

Fresh comparison against app.models.audit_log.AuditLog (not the earlier
Phase 0 snapshot -- actor_id was already fixed during the users PK
migration and needs no further changes here):

  - actor_id: already uuid, already FK'd to users(id) ON DELETE SET NULL.
    Matches the model exactly. Untouched.
  - log_metadata (JSONB, nullable): MISSING. Added here.
  - ip_address (INET, nullable): MISSING. Added here.
  - entity_id: still integer, 669 of 1154 rows NULL. The model wants
    UUID NOT NULL. Deliberately NOT touched in this migration -- unlike
    log_metadata/ip_address, there's no clean, non-destructive way to
    convert it (entity_id is a documented unenforced polymorphic
    pointer, per the model's own docstring, into tables that mostly
    haven't been PK-converted yet, so old integer values can't be
    mapped to a real UUID the way users.id could). Converting it
    without a real mapping would mean fabricating meaningless UUIDs.
    Left for its own phase if/when it's needed.

Both new columns are nullable with no backfill -- there's no prior data
to derive log_metadata or ip_address from (they never existed), and
nullable is exactly what the model specifies for both. No existing row
is modified, no existing column altered. Only audit_logs is touched;
no other table has a FK dependency requiring changes.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a91d6f2c4e83'
down_revision: Union[str, None] = 'f7c25e8b3a91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('audit_logs', sa.Column('log_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('audit_logs', sa.Column('ip_address', postgresql.INET(), nullable=True))


def downgrade() -> None:
    op.drop_column('audit_logs', 'ip_address')
    op.drop_column('audit_logs', 'log_metadata')
