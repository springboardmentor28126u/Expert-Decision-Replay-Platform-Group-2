"""sync notification schema

Revision ID: 5d6f8e9e6c6b
Revises: 347fa47bec5e
Create Date: 2026-08-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.

revision: str = "5d6f8e9e6c6b"
down_revision: Union[str, Sequence[str], None] = "347fa47bec5e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Make notifications.type match the SQLAlchemy model:
    # nullable=False
    op.alter_column(
        "notifications",
        "type",
        existing_type=sa.String(length=50),
        nullable=False,
    )

    # Add the index declared by the Notification model.
    op.create_index(
        "ix_notifications_user_id",
        "notifications",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""

    # Remove the index added above.
    op.drop_index(
        "ix_notifications_user_id",
        table_name="notifications",
    )

    # Restore the previous database state.
    op.alter_column(
        "notifications",
        "type",
        existing_type=sa.String(length=50),
        nullable=True,
    )