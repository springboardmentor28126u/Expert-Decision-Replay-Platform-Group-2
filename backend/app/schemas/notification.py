"""
schemas/notification.py
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.enums import NotificationType
from app.schemas.common import ORMBase


class NotificationOut(ORMBase):
    id: uuid.UUID
    type: NotificationType
    title: str
    message: str
    is_read: bool
    # Optional: notifications created before this field existed have no
    # real value to report. Every notification the app creates today
    # still always supplies both (see NotificationService.create_notification
    # and every call site in ApprovalService) -- this only accommodates
    # historical rows.
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[uuid.UUID] = None
    created_at: datetime


class NotificationMarkReadRequest(BaseModel):
    """
    PATCH /notifications/read — bulk mark-as-read. Empty `notification_ids`
    is interpreted by the service layer as "mark all of the current
    user's notifications as read".
    """
    notification_ids: list[uuid.UUID] = []

