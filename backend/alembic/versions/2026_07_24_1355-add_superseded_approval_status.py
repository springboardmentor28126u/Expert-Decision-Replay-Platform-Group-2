"""add_superseded_approval_status

Revision ID: a1b2c3d4e5f6
Revises: 3cd8b9b94aac
Create Date: 2026-07-24 13:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '3cd8b9b94aac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL stores SQLAlchemy Enum names (UPPERCASE), not .value (lowercase).
    # Recreate the enum type with the additional SUPERSEDED member.
    op.execute("ALTER TABLE approvals ALTER COLUMN status TYPE VARCHAR(20)")
    op.execute("DROP TYPE IF EXISTS approval_status")
    op.execute(
        "CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'SUPERSEDED')"
    )
    op.execute(
        "ALTER TABLE approvals ALTER COLUMN status TYPE approval_status USING status::approval_status"
    )


def downgrade() -> None:
    # Revert to the original enum without 'SUPERSEDED'
    op.execute("UPDATE approvals SET status = 'CANCELLED' WHERE status = 'SUPERSEDED'")
    op.execute("ALTER TABLE approvals ALTER COLUMN status TYPE VARCHAR(20)")
    op.execute("DROP TYPE IF EXISTS approval_status")
    op.execute(
        "CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')"
    )
    op.execute(
        "ALTER TABLE approvals ALTER COLUMN status TYPE approval_status USING status::approval_status"
    )
