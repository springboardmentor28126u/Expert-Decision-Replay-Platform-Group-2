"""phase F3: parallel UUID FK columns on every table referencing decisions, backfill, constrain

Revision ID: d2a69c3f8e01
Revises: c8f14a2e6b75
Create Date: 2026-08-04

Mirrors Phase C2 (users), for decisions. All 4 FKs referencing
decisions(id) want the SAME final column name (decision_id) as their
current name, so every one of them needs the temporary _new suffix
(unlike users, where several referencing columns needed a rename
anyway and could take their final name immediately).

Per your rule 7: alternatives, approvals, and decision_versions are
touched ONLY on this one column each -- nothing else about those
tables changes. discussion_messages (legacy, no model equivalent) gets
the same treatment for referential integrity, consistent with how it
was handled during the users PK conversion.

ON DELETE behavior matches app.models.decision for the 3 mapped
tables (alternatives, approvals, decision_versions: all CASCADE) and
preserves the original behavior (none specified) for the legacy-only
discussion_messages table.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'd2a69c3f8e01'
down_revision: Union[str, None] = 'c8f14a2e6b75'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _add_backfill_constrain(table, old_col, new_col, *, add_index, ondelete, fk_name):
    op.add_column(table, sa.Column(new_col, postgresql.UUID(as_uuid=True), nullable=True))
    op.execute(f"""
        UPDATE "{table}" t
        SET {new_col} = d.id_uuid
        FROM decisions d
        WHERE d.id = t.{old_col}
    """)
    op.alter_column(table, new_col, nullable=False)
    if add_index:
        op.create_index(f'ix_{table}_{new_col}', table, [new_col], unique=False)
    kwargs = {'ondelete': ondelete} if ondelete else {}
    op.create_foreign_key(fk_name, table, 'decisions', [new_col], ['id_uuid'], **kwargs)


def upgrade() -> None:
    _add_backfill_constrain(
        'alternatives', 'decision_id', 'decision_id_new',
        add_index=True, ondelete='CASCADE', fk_name='fk_alternatives_decision_id_new_decisions',
    )
    _add_backfill_constrain(
        'approvals', 'decision_id', 'decision_id_new',
        add_index=True, ondelete='CASCADE', fk_name='fk_approvals_decision_id_new_decisions',
    )
    _add_backfill_constrain(
        'decision_versions', 'decision_id', 'decision_id_new',
        add_index=True, ondelete='CASCADE', fk_name='fk_decision_versions_decision_id_new_decisions',
    )
    _add_backfill_constrain(
        'discussion_messages', 'decision_id', 'decision_id_new',
        add_index=False, ondelete=None, fk_name='fk_discussion_messages_decision_id_new_decisions',
    )


def downgrade() -> None:
    for table, has_index, fk_name in [
        ('discussion_messages', False, 'fk_discussion_messages_decision_id_new_decisions'),
        ('decision_versions', True, 'fk_decision_versions_decision_id_new_decisions'),
        ('approvals', True, 'fk_approvals_decision_id_new_decisions'),
        ('alternatives', True, 'fk_alternatives_decision_id_new_decisions'),
    ]:
        op.drop_constraint(fk_name, table, type_='foreignkey')
        if has_index:
            op.drop_index(f'ix_{table}_decision_id_new', table_name=table)
        op.drop_column(table, 'decision_id_new')
