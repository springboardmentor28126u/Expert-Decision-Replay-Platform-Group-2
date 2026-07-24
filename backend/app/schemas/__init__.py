"""
schemas/__init__.py

Convenience re-exports so routers can do `from schemas import UserOut`
instead of `from schemas.user import UserOut` everywhere. Both import
styles work; routers in this project use the explicit per-module form
for clarity, but this aggregator is kept for scripts/tests/notebooks.
"""

from app.schemas.common import ORMBase, PaginatedResponse, PaginationParams  # noqa: F401
from app.schemas.token import LogoutRequest, RefreshTokenRequest, Token, TokenPayload  # noqa: F401

from app.schemas.role import RoleCreate, RoleOut  # noqa: F401
from app.schemas.team import TeamCreate, TeamDetailOut, TeamOut, TeamUpdate  # noqa: F401
from app.schemas.user import (  # noqa: F401
    PasswordChange,
    UserCreate,
    UserOut,
    UserSelfUpdate,
    UserUpdate,
)
from app.schemas.decision import (  # noqa: F401
    DecisionCreate,
    DecisionOut,
    DecisionStatusUpdate,
    DecisionUpdate,
)
from app.schemas.alternative import (  # noqa: F401
    AlternativeCreate,
    AlternativeOut,
    AlternativeSelect,
    AlternativeUpdate,
)
from app.schemas.comment import CommentCreate, CommentOut, CommentThreadOut, CommentUpdate  # noqa: F401
from app.schemas.approval import ApprovalAssign, ApprovalDecision, ApprovalOut  # noqa: F401
from app.schemas.attachment import AttachmentDownloadURL, AttachmentOut  # noqa: F401
from app.schemas.notification import NotificationMarkReadRequest, NotificationOut  # noqa: F401
from app.schemas.audit_log import AuditLogOut  # noqa: F401

