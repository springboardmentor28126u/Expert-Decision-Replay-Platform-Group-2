"""
models/__init__.py

Single import point so Alembic's env.py (and anything else needing
Base.metadata fully populated) only has to `import models`.

Import order is alphabetical — SQLAlchemy resolves the actual dependency
graph lazily via string-based relationship() targets, so declaration
order here doesn't matter as long as every module gets imported once.
"""

from app.database import Base  # noqa: F401
from app.models.refresh_token import RefreshToken  # noqa: F401
from app.models.role import Role  # noqa: F401
from app.models.team import Team  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.decision import Decision  # noqa: F401
from app.models.alternative import Alternative  # noqa: F401
from app.models.comment import Comment  # noqa: F401
from app.models.approval import Approval  # noqa: F401
from app.models.attachment import Attachment  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401

__all__ = [
    "Base",
    "Role",
    "Team",
    "User",
    "Decision",
    "Alternative",
    "Comment",
    "Approval",
    "Attachment",
    "Notification",
    "AuditLog",
]

__all__ = [
    "Base", "Role", "Team", "User", "RefreshToken", "Decision",
    "Alternative", "Comment", "Approval", "Attachment",
    "Notification", "AuditLog",
]
