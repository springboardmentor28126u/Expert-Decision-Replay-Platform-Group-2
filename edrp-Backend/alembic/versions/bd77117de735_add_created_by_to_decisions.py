from alembic import op
import sqlalchemy as sa


revision = 'bd77117de735'
down_revision = '4a199f245152'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'decisions',
        sa.Column(
            'created_by',
            sa.Integer(),
            nullable=True
        )
    )

    op.create_foreign_key(
        'fk_decisions_created_by_users',
        'decisions',
        'users',
        ['created_by'],
        ['id']
    )


def downgrade():
    op.drop_constraint(
        'fk_decisions_created_by_users',
        'decisions',
        type_='foreignkey'
    )

    op.drop_column(
        'decisions',
        'created_by'
    )