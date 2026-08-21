"""Add signature fields to approvals for digital attestation.

Revision ID: 2026_08_12_1600
Revises: 2026_08_12_1500_f6a7b8c9d0e1
Create Date: 2026-08-12 16:00:00.000000+00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision = "2026_08_12_1600"
down_revision = "2026_08_12_1500_f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("approvals", sa.Column("signature_hash", sa.String(64), nullable=True))
    op.add_column("approvals", sa.Column("attested_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("approvals", sa.Column("attestation_text", sa.Text(), nullable=True))
    op.create_index("ix_approvals_signature_hash", "approvals", ["signature_hash"])


def downgrade() -> None:
    op.drop_index("ix_approvals_signature_hash", table_name="approvals")
    op.drop_column("approvals", "attestation_text")
    op.drop_column("approvals", "attested_at")
    op.drop_column("approvals", "signature_hash")
