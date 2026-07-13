"""
schemas/notification.py
"""

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import NotificationType
from app.schemas.common import ORMBase


class NotificationOut(ORMBase):
    id: uuid.UUID
    type: NotificationType
    title: str
    message: str
    is_read: bool
    related_entity_type: str
    related_entity_id: uuid.UUID
    created_at: datetime


class NotificationMarkReadRequest(BaseModel):
    """
    PATCH /notifications/read — bulk mark-as-read. Empty `notification_ids`
    is interpreted by the service layer as "mark all of the current
    user's notifications as read".
    """
    notification_ids: list[uuid.UUID] = []
