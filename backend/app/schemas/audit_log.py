"""
schemas/audit_log.py

Read-only: AuditLog rows are written exclusively by services.py code
(via an internal helper, not a public endpoint), so this file only
defines an output schema — there is intentionally no AuditLogCreate,
since audit entries must never be forgeable through a public API
surface.
"""

import uuid
from datetime import datetime
from typing import Optional

from app.schemas.common import ORMBase


class AuditLogActorSummary(ORMBase):
    id: uuid.UUID
    full_name: str
    email: str


class AuditLogOut(ORMBase):
    id: uuid.UUID
    action: str
    entity_type: str
    entity_id: uuid.UUID
    log_metadata: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: datetime
    actor: Optional[AuditLogActorSummary] = None

