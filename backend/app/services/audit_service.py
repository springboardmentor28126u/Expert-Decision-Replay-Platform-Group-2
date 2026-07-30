import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.exceptions.handlers import NotFoundException
from app.models.audit_log import AuditLog
from app.repositories.audit_repository import AuditRepository
from app.schemas.audit_log import AuditLogListResponse, AuditLogResponse

logger = logging.getLogger(__name__)


class AuditService:

    def __init__(self, db: Session):
        self.audit_repo = AuditRepository(db)

    def log_action(
        self,
        user_id: Optional[int] = None,
        action: str = "",
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        description: Optional[str] = None,
        endpoint: Optional[str] = None,
        http_method: Optional[str] = None,
        response_status: Optional[int] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            endpoint=endpoint,
            http_method=http_method,
            response_status=response_status,
            ip_address=ip_address,
        )
        audit_log = self.audit_repo.create(audit_log)
        logger.debug(f"Audit log created: {audit_log.id} action={action}")
        return audit_log

    def log_login(self, user_id: int, ip_address: Optional[str] = None) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="LOGIN",
            description="User logged in",
            ip_address=ip_address,
        )

    def log_logout(self, user_id: int, ip_address: Optional[str] = None) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="LOGOUT",
            description="User logged out",
            ip_address=ip_address,
        )

    def log_decision_created(
        self, user_id: int, decision_id: int, title: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="DECISION_CREATED",
            entity_type="decision",
            entity_id=decision_id,
            description=f"Decision created: {title}" if title else "Decision created",
        )

    def log_decision_updated(
        self, user_id: int, decision_id: int, title: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="DECISION_UPDATED",
            entity_type="decision",
            entity_id=decision_id,
            description=f"Decision updated: {title}" if title else "Decision updated",
        )

    def log_decision_deleted(
        self, user_id: int, decision_id: int, title: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="DECISION_DELETED",
            entity_type="decision",
            entity_id=decision_id,
            description=f"Decision deleted: {title}" if title else "Decision deleted",
        )

    def log_decision_replayed(
        self, user_id: int, decision_id: int, title: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="DECISION_REPLAYED",
            entity_type="decision",
            entity_id=decision_id,
            description=f"Decision replayed: {title}" if title else "Decision replayed",
        )

    def log_file_uploaded(
        self, user_id: int, decision_id: int, filename: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="FILE_UPLOADED",
            entity_type="file_attachment",
            entity_id=decision_id,
            description=f"File uploaded: {filename}" if filename else "File uploaded",
        )

    def log_discussion_created(
        self, user_id: int, decision_id: int, discussion_type: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="DISCUSSION_CREATED",
            entity_type="discussion",
            entity_id=decision_id,
            description=f"Discussion created (type={discussion_type})"
            if discussion_type
            else "Discussion created",
        )

    def log_alternative_added(
        self, user_id: int, decision_id: int, title: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="ALTERNATIVE_ADDED",
            entity_type="alternative",
            entity_id=decision_id,
            description=f"Alternative added: {title}" if title else "Alternative added",
        )

    def log_approval(
        self, user_id: int, decision_id: int, new_status: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="STATUS_CHANGED",
            entity_type="decision",
            entity_id=decision_id,
            description=f"Decision status changed to: {new_status}"
            if new_status
            else "Decision status changed",
        )

    def get_audit_log(self, log_id: int) -> AuditLog:
        audit_log = self.audit_repo.get_by_id_with_user(log_id)
        if not audit_log:
            raise NotFoundException(f"Audit log with ID {log_id} not found")
        return audit_log

    def get_audit_logs(
        self,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        start_date=None,
        end_date=None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> AuditLogListResponse:
        skip = (page - 1) * page_size
        items = self.audit_repo.get_filtered(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            start_date=start_date,
            end_date=end_date,
            search=search,
            skip=skip,
            limit=page_size,
        )
        total = self.audit_repo.count_filtered(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            start_date=start_date,
            end_date=end_date,
            search=search,
        )
        return AuditLogListResponse(
            items=[AuditLogResponse.model_validate(log) for log in items],
            total=total,
            page=page,
            page_size=page_size,
        )
