"""phase C2: parallel UUID FK columns on every table referencing users, backfill, constrain

Revision ID: d5a03c2f8b69
Revises: c4f92b1e7a58
Create Date: 2026-08-04

Second stage of the users PK conversion. For every one of the 10
foreign keys discovered pointing at users(id) (across approvals,
audit_logs, decision_versions, decisions x2, discussion_messages,
notifications, reviewer_assignments x2, uploaded_files), adds a
parallel UUID column, backfills it by joining the old integer value
through users.id -> users.id_uuid, and adds a REAL foreign key
constraint against users(id_uuid) -- which is legal because id_uuid
already carries a UNIQUE constraint from Phase C1, not because it's
the primary key yet. This means referential integrity is verified by
Postgres itself, not just by manual queries, before anything is
promoted in Phase C3.

New columns get their final app.models column name directly where
there is no name collision with the old column (created_by ->
created_by_id, audit_logs.user_id -> actor_id, notifications.user_id
-> recipient_id, decision_versions.changed_by -> changed_by_id) --
this does the eventual rename now, at zero extra cost, since a new
column has to be created either way. Where the final name collides
with the still-live old column (approvals.reviewer_id), a temporary
_new suffix is used, resolved in Phase C3. The 3 legacy tables with no
model equivalent (discussion_messages, reviewer_assignments,
uploaded_files) get a plain _uuid-suffixed column -- their referential
integrity is preserved without inventing app-facing names for
columns the app never reads.

Also completes the 2 FKs deliberately deferred in Phase A
(teams.manager_id, refresh_tokens.user_id) -- both already UUID, both
currently 0 rows, so this is immediate with nothing to backfill.

Nullability and ON DELETE behavior for the 7 model-mapped columns
follow app.models exactly. The 3 legacy-only columns keep NOT NULL
(matching their original columns) and no ON DELETE clause (matching
the original FKs, which had none), since the model specifies nothing
for tables it doesn't map.

Old integer columns and old FK constraints are NOT touched here --
every existing query against the old shape keeps working exactly as
before. Phase C3 is the only phase that removes anything.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'd5a03c2f8b69'
down_revision: Union[str, None] = 'c4f92b1e7a58'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _add_backfill_constrain(
    table, old_col, new_col, *, not_null, ondelete, add_index, fk_name
):
    op.add_column(table, sa.Column(new_col, postgresql.UUID(as_uuid=True), nullable=True))
    op.execute(f"""
        UPDATE "{table}" t
        SET {new_col} = u.id_uuid
        FROM users u
        WHERE u.id = t.{old_col}
    """)
    if not_null:
        op.alter_column(table, new_col, nullable=False)
    if add_index:
        op.create_index(f'ix_{table}_{new_col}', table, [new_col], unique=False)
    kwargs = {'ondelete': ondelete} if ondelete else {}
    op.create_foreign_key(fk_name, table, 'users', [new_col], ['id_uuid'], **kwargs)


def upgrade() -> None:
    # --- approvals.reviewer_id -> reviewer_id_new (collides with live column) ---
    _add_backfill_constrain(
        'approvals', 'reviewer_id', 'reviewer_id_new',
        not_null=True, ondelete='RESTRICT', add_index=True,
        fk_name='fk_approvals_reviewer_id_new_users',
    )

    # --- audit_logs.user_id -> actor_id (final model name, no collision) ---
    _add_backfill_constrain(
        'audit_logs', 'user_id', 'actor_id',
        not_null=False, ondelete='SET NULL', add_index=True,
        fk_name='fk_audit_logs_actor_id_users',
    )

    # --- decision_versions.changed_by -> changed_by_id (final model name) ---
    _add_backfill_constrain(
        'decision_versions', 'changed_by', 'changed_by_id',
        not_null=False, ondelete='SET NULL', add_index=True,
        fk_name='fk_decision_versions_changed_by_id_users',
    )

    # --- decisions.created_by -> created_by_id (final model name) ---
    _add_backfill_constrain(
        'decisions', 'created_by', 'created_by_id',
        not_null=True, ondelete='RESTRICT', add_index=True,
        fk_name='fk_decisions_created_by_id_users',
    )

    # --- decisions.assigned_reviewer_id -> assigned_reviewer_id_uuid (no model equivalent) ---
    _add_backfill_constrain(
        'decisions', 'assigned_reviewer_id', 'assigned_reviewer_id_uuid',
        not_null=False, ondelete=None, add_index=False,
        fk_name='fk_decisions_assigned_reviewer_id_uuid_users',
    )

    # --- discussion_messages.user_id -> user_id_uuid (legacy, no model equivalent) ---
    _add_backfill_constrain(
        'discussion_messages', 'user_id', 'user_id_uuid',
        not_null=True, ondelete=None, add_index=False,
        fk_name='fk_discussion_messages_user_id_uuid_users',
    )

    # --- notifications.user_id -> recipient_id (final model name) ---
    _add_backfill_constrain(
        'notifications', 'user_id', 'recipient_id',
        not_null=True, ondelete='CASCADE', add_index=True,
        fk_name='fk_notifications_recipient_id_users',
    )

    # --- reviewer_assignments.assigned_by -> assigned_by_uuid (legacy) ---
    _add_backfill_constrain(
        'reviewer_assignments', 'assigned_by', 'assigned_by_uuid',
        not_null=True, ondelete=None, add_index=False,
        fk_name='fk_reviewer_assignments_assigned_by_uuid_users',
    )

    # --- reviewer_assignments.reviewer_id -> reviewer_id_uuid (legacy) ---
    _add_backfill_constrain(
        'reviewer_assignments', 'reviewer_id', 'reviewer_id_uuid',
        not_null=True, ondelete=None, add_index=False,
        fk_name='fk_reviewer_assignments_reviewer_id_uuid_users',
    )

    # --- uploaded_files.user_id -> user_id_uuid (legacy, 0 rows) ---
    _add_backfill_constrain(
        'uploaded_files', 'user_id', 'user_id_uuid',
        not_null=True, ondelete=None, add_index=False,
        fk_name='fk_uploaded_files_user_id_uuid_users',
    )

    # --- complete the 2 FKs deferred in Phase A (already UUID, 0 rows, nothing to backfill) ---
    op.create_foreign_key(
        'fk_teams_manager_id_users', 'teams', 'users', ['manager_id'], ['id_uuid'], ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_refresh_tokens_user_id_users', 'refresh_tokens', 'users', ['user_id'], ['id_uuid'], ondelete='CASCADE'
    )


def downgrade() -> None:
    op.drop_constraint('fk_refresh_tokens_user_id_users', 'refresh_tokens', type_='foreignkey')
    op.drop_constraint('fk_teams_manager_id_users', 'teams', type_='foreignkey')

    for table, col, has_index, fk_name in [
        ('uploaded_files', 'user_id_uuid', False, 'fk_uploaded_files_user_id_uuid_users'),
        ('reviewer_assignments', 'reviewer_id_uuid', False, 'fk_reviewer_assignments_reviewer_id_uuid_users'),
        ('reviewer_assignments', 'assigned_by_uuid', False, 'fk_reviewer_assignments_assigned_by_uuid_users'),
        ('notifications', 'recipient_id', True, 'fk_notifications_recipient_id_users'),
        ('discussion_messages', 'user_id_uuid', False, 'fk_discussion_messages_user_id_uuid_users'),
        ('decisions', 'assigned_reviewer_id_uuid', False, 'fk_decisions_assigned_reviewer_id_uuid_users'),
        ('decisions', 'created_by_id', True, 'fk_decisions_created_by_id_users'),
        ('decision_versions', 'changed_by_id', True, 'fk_decision_versions_changed_by_id_users'),
        ('audit_logs', 'actor_id', True, 'fk_audit_logs_actor_id_users'),
        ('approvals', 'reviewer_id_new', True, 'fk_approvals_reviewer_id_new_users'),
    ]:
        op.drop_constraint(fk_name, table, type_='foreignkey')
        if has_index:
            op.drop_index(f'ix_{table}_{col}', table_name=table)
        op.drop_column(table, col)
