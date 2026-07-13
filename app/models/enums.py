"""
models/enums.py

Fixed vocabularies used across the schema, defined as Python enums and
mapped to native PostgreSQL ENUM types via SQLAlchemy's `Enum`.

Native PG enums are used for the small, truly-fixed vocabularies
(decision status, approval status, notification type) for free DB-level
integrity. `RoleName` is NOT used as a DB enum on User — Role is a real
lookup table (models/role.py) so new/custom roles can be added via data.
"""

import enum


class RoleName(str, enum.Enum):
    EMPLOYEE = "employee"
    REVIEWER = "reviewer"
    MANAGER = "manager"
    ADMINISTRATOR = "administrator"


class DecisionStatus(str, enum.Enum):
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ESCALATED = "escalated"


class NotificationType(str, enum.Enum):
    APPROVAL_REQUEST = "approval_request"
    APPROVAL_DECISION = "approval_decision"
    COMMENT_MENTION = "comment_mention"
    DECISION_STATUS_CHANGE = "decision_status_change"
    ESCALATION = "escalation"
    SYSTEM = "system"


class AttachmentOwnerType(str, enum.Enum):
    """
    Reference vocabulary only (used e.g. in AuditLog.entity_type values).
    Attachment itself uses three explicit nullable FKs rather than a
    polymorphic owner_id, since Postgres can't enforce a polymorphic FK —
    see models/attachment.py.
    """
    DECISION = "decision"
    ALTERNATIVE = "alternative"
    COMMENT = "comment"
