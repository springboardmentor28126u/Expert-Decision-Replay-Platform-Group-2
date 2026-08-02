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

    # ===== Authentication Events =====
    def log_login_success(self, user_id: int, ip_address: Optional[str] = None) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="LOGIN_SUCCESS",
            entity_type="User",
            entity_id=user_id,
            description="User logged in successfully",
            ip_address=ip_address,
        )

    def log_login_failed(self, email: str, ip_address: Optional[str] = None) -> AuditLog:
        return self.log_action(
            user_id=None,
            action="LOGIN_FAILED",
            entity_type="User",
            description=f"Failed login attempt for email: {email}",
            ip_address=ip_address,
        )

    def log_logout(self, user_id: int, ip_address: Optional[str] = None) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="LOGOUT",
            entity_type="User",
            entity_id=user_id,
            description="User logged out",
            ip_address=ip_address,
        )

    # ===== Decision Workflow Events =====
    def log_decision_created(
        self, user_id: int, decision_id: int, title: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="DECISION_CREATED",
            entity_type="Decision",
            entity_id=decision_id,
            description=f"Decision created: {title}" if title else "Decision created",
        )

    def log_decision_updated(
        self, user_id: int, decision_id: int, title: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="DECISION_UPDATED",
            entity_type="Decision",
            entity_id=decision_id,
            description=f"Decision updated: {title}" if title else "Decision updated",
        )

    def log_decision_submitted(
        self, user_id: int, decision_id: int, title: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="DECISION_SUBMITTED",
            entity_type="Decision",
            entity_id=decision_id,
            description=f"Decision submitted for review: {title}" if title else "Decision submitted for review",
        )

    def log_decision_approved(
        self, user_id: int, decision_id: int, title: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="DECISION_APPROVED",
            entity_type="Decision",
            entity_id=decision_id,
            description=f"Decision approved: {title}" if title else "Decision approved",
        )

    def log_decision_rejected(
        self, user_id: int, decision_id: int, title: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="DECISION_REJECTED",
            entity_type="Decision",
            entity_id=decision_id,
            description=f"Decision rejected: {title}" if title else "Decision rejected",
        )

    def log_decision_deleted(
        self, user_id: int, decision_id: int, title: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="DECISION_DELETED",
            entity_type="Decision",
            entity_id=decision_id,
            description=f"Decision deleted: {title}" if title else "Decision deleted",
        )

    # ===== Decision Replay Events =====
    def log_replay_started(
        self, user_id: int, decision_id: int, title: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="REPLAY_STARTED",
            entity_type="Decision",
            entity_id=decision_id,
            description=f"Replay started for decision: {title}" if title else "Replay started",
        )

    def log_replay_completed(
        self, user_id: int, decision_id: int, title: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="REPLAY_COMPLETED",
            entity_type="Decision",
            entity_id=decision_id,
            description=f"Replay completed for decision: {title}" if title else "Replay completed",
        )

    # ===== Collaboration Events =====
    def log_discussion_created(
        self, user_id: int, decision_id: int, discussion_type: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="DISCUSSION_CREATED",
            entity_type="Discussion",
            entity_id=decision_id,
            description=f"Discussion created (type={discussion_type})" if discussion_type else "Discussion created",
        )

    def log_discussion_comment_added(
        self, user_id: int, decision_id: int
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="DISCUSSION_COMMENT_ADDED",
            entity_type="Discussion",
            entity_id=decision_id,
            description="Comment added to discussion thread",
        )

    def log_alternative_added(
        self, user_id: int, decision_id: int, name: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="ALTERNATIVE_ADDED",
            entity_type="Alternative",
            entity_id=decision_id,
            description=f"Alternative added: {name}" if name else "Alternative added",
        )

    def log_file_uploaded(
        self, user_id: int, decision_id: int, filename: Optional[str] = None
    ) -> AuditLog:
        return self.log_action(
            user_id=user_id,
            action="FILE_UPLOADED",
            entity_type="FileAttachment",
            entity_id=decision_id,
            description=f"File uploaded: {filename}" if filename else "File uploaded",
        )

    # ===== Administration Events =====
    def log_user_created(
        self, admin_id: Optional[int], target_user_id: int, username: str
    ) -> AuditLog:
        return self.log_action(
            user_id=admin_id,
            action="USER_CREATED",
            entity_type="User",
            entity_id=target_user_id,
            description=f"User account created: {username}",
        )

    def log_user_updated(
        self, admin_id: int, target_user_id: int, username: str
    ) -> AuditLog:
        return self.log_action(
            user_id=admin_id,
            action="USER_UPDATED",
            entity_type="User",
            entity_id=target_user_id,
            description=f"User account updated: {username}",
        )

    def log_user_deleted(
        self, admin_id: int, target_user_id: int
    ) -> AuditLog:
        return self.log_action(
            user_id=admin_id,
            action="USER_DELETED",
            entity_type="User",
            entity_id=target_user_id,
            description=f"User account deleted (ID: #{target_user_id})",
        )

    def log_user_role_changed(
        self, admin_id: int, target_user_id: int, new_role: str
    ) -> AuditLog:
        return self.log_action(
            user_id=admin_id,
            action="USER_ROLE_CHANGED",
            entity_type="User",
            entity_id=target_user_id,
            description=f"User role changed to: {new_role}",
        )

    # ===== Query & Retrieval =====
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
        sort_order: str = "desc",
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
            sort_order=sort_order,
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
