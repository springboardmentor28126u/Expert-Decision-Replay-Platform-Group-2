"""phase Q2: add notifications.id_uuid, populate, unique constraint

Revision ID: b8f25e0d4c63
Revises: a7e14d9c3b52
Create Date: 2026-08-04

Same staged pattern as every table. Zero foreign keys reference
notifications(id) -- confirmed.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b8f25e0d4c63'
down_revision: Union[str, None] = 'a7e14d9c3b52'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('notifications', sa.Column('id_uuid', postgresql.UUID(as_uuid=True), nullable=True))
    op.execute("UPDATE notifications SET id_uuid = gen_random_uuid()")
    op.alter_column('notifications', 'id_uuid', nullable=False)
    op.create_unique_constraint('uq_notifications_id_uuid', 'notifications', ['id_uuid'])


def downgrade() -> None:
    op.drop_constraint('uq_notifications_id_uuid', 'notifications', type_='unique')
    op.drop_column('notifications', 'id_uuid')
