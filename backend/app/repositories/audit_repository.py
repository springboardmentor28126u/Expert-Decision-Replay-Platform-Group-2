from datetime import datetime
from typing import Optional, List

from sqlalchemy.orm import Session, joinedload

from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository


class AuditRepository(BaseRepository[AuditLog]):

    def __init__(self, db: Session):
        super().__init__(AuditLog, db)

    def get_by_id_with_user(self, id: int) -> Optional[AuditLog]:
        return (
            self.db.query(AuditLog)
            .options(joinedload(AuditLog.user))
            .filter(AuditLog.id == id)
            .first()
        )

    def get_filtered(
        self,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[AuditLog]:
        query = self.db.query(AuditLog).options(joinedload(AuditLog.user))

        if user_id is not None:
            query = query.filter(AuditLog.user_id == user_id)
        if action:
            query = query.filter(AuditLog.action == action)
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)
        if entity_id is not None:
            query = query.filter(AuditLog.entity_id == entity_id)
        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)
        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)
        if search:
            query = query.filter(AuditLog.description.ilike(f"%{search}%"))

        return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    def count_filtered(
        self,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        search: Optional[str] = None,
    ) -> int:
        query = self.db.query(AuditLog)

        if user_id is not None:
            query = query.filter(AuditLog.user_id == user_id)
        if action:
            query = query.filter(AuditLog.action == action)
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)
        if entity_id is not None:
            query = query.filter(AuditLog.entity_id == entity_id)
        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)
        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)
        if search:
            query = query.filter(AuditLog.description.ilike(f"%{search}%"))

        return query.count()
