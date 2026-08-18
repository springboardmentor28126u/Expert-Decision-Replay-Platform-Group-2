"""Decision service — decision CRUD, status transitions, and version tracking."""

import logging
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy.orm import Session

from app.exceptions.handlers import NotFoundException, BadRequestException
from app.models.decision import Decision
from app.models.decision_history import DecisionHistory
from app.models.user import User
from app.repositories.decision_repository import DecisionRepository
from app.repositories.version_repository import VersionRepository
from app.schemas.decision import DecisionCreate, DecisionUpdate, DecisionListResponse, DecisionResponse

from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

VALID_STATUSES = {"Draft", "Under Review", "Approved", "Rejected", "Archived"}


class DecisionService:
    """Service handling decision management business logic."""

    def __init__(self, db: Session):
        self.decision_repo = DecisionRepository(db)
        self.version_repo = VersionRepository(db)
        self.audit_service = AuditService(db)
        self.notification_service = NotificationService(db)
        self.db = db


    def create_decision(self, data: DecisionCreate, user: User) -> Decision:
        """Create a new decision."""
        decision = Decision(
            title=data.title,
            description=data.description,
            category=data.category,
            status="Draft",
            created_by=user.id,
        )
        decision = self.decision_repo.create(decision)
        logger.info(f"Decision created: {decision.id} by user {user.id}")

        self.audit_service.log_decision_created(
            user_id=user.id,
            decision_id=decision.id,
            title=decision.title,
        )
        return decision

    def get_decision(self, decision_id: int) -> Decision:
        """Get a single decision with all related data."""
        decision = self.decision_repo.get_by_id_with_relations(decision_id)
        if not decision:
            raise NotFoundException(f"Decision with ID {decision_id} not found")
        return decision

    def get_decisions(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        created_by: Optional[int] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> DecisionListResponse:
        """Get paginated and filtered list of decisions."""
        skip = (page - 1) * page_size
        items = self.decision_repo.get_filtered(
            status=status,
            category=category,
            created_by=created_by,
            search=search,
            skip=skip,
            limit=page_size,
        )
        total = self.decision_repo.count_filtered(
            status=status,
            category=category,
            created_by=created_by,
            search=search,
        )
        return DecisionListResponse(
            items=[DecisionResponse.model_validate(d) for d in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def update_decision(self, decision_id: int, data: DecisionUpdate, user: User) -> Decision:
        """Update a decision and record version history."""
        decision = self.decision_repo.get_by_id(decision_id)
        if not decision:
            raise NotFoundException(f"Decision with ID {decision_id} not found")

        # Track changes for version history
        changed_fields = {}
        if data.title is not None and data.title != decision.title:
            changed_fields["title"] = {"old": decision.title, "new": data.title}
        if data.description is not None and data.description != decision.description:
            changed_fields["description"] = {"old": decision.description, "new": data.description}
        if data.category is not None and data.category != decision.category:
            changed_fields["category"] = {"old": decision.category, "new": data.category}

        if changed_fields:
            # Create version record
            history = DecisionHistory(
                decision_id=decision_id,
                old_title=decision.title,
                old_description=decision.description,
                changed_fields=changed_fields,
                updated_by=user.id,
            )
            self.version_repo.create(history)

            # Apply updates
            if data.title is not None:
                decision.title = data.title
            if data.description is not None:
                decision.description = data.description
            if data.category is not None:
                decision.category = data.category

            decision.updated_at = datetime.now(timezone.utc)
            decision = self.decision_repo.update(decision)
            logger.info(f"Decision {decision_id} updated by user {user.id}")

            self.audit_service.log_decision_updated(
                user_id=user.id,
                decision_id=decision_id,
                title=decision.title,
            )

        return decision

    def update_status(self, decision_id: int, status: str, user: User) -> Decision:
        """Change the status of a decision."""
        if status not in VALID_STATUSES:
            raise BadRequestException(
                f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"
            )

        decision = self.decision_repo.get_by_id(decision_id)
        if not decision:
            raise NotFoundException(f"Decision with ID {decision_id} not found")

        old_status = decision.status

        # Record status change in history
        history = DecisionHistory(
            decision_id=decision_id,
            old_title=decision.title,
            old_description=decision.description,
            changed_fields={"status": {"old": old_status, "new": status}},
            updated_by=user.id,
        )
        self.version_repo.create(history)

        decision.status = status
        decision.updated_at = datetime.now(timezone.utc)
        decision = self.decision_repo.update(decision)

        logger.info(f"Decision {decision_id} status: {old_status} → {status}")

        if status == "Under Review":
            self.audit_service.log_decision_submitted(user_id=user.id, decision_id=decision_id, title=decision.title)
        elif status == "Approved":
            self.audit_service.log_decision_approved(user_id=user.id, decision_id=decision_id, title=decision.title)
        elif status == "Rejected":
            self.audit_service.log_decision_rejected(user_id=user.id, decision_id=decision_id, title=decision.title)
        else:
            self.audit_service.log_action(
                user_id=user.id,
                action="STATUS_CHANGED",
                entity_type="Decision",
                entity_id=decision_id,
                description=f"Decision status changed to: {status}",
            )

        # Notify decision creator of status change
        if decision and decision.created_by:
            try:
                type_map = {
                    "Approved": "DECISION_APPROVED",
                    "Rejected": "DECISION_REJECTED",
                    "Under Review": "APPROVAL_REQUEST",
                }
                notif_type = type_map.get(status, "STATUS_CHANGED")
                actor_name = user.username if hasattr(user, "username") else "A user"
                self.notification_service.create_notification(
                    user_id=decision.created_by,
                    title=f"Decision Status Updated: {status}",
                    message=f"Your decision '{decision.title or f'#{decision_id}'}' status was updated from '{old_status}' to '{status}' by {actor_name}.",
                    type=notif_type,
                    link_url=f"/dashboard/decisions/{decision_id}"
                )
            except Exception as e:
                logger.warning(f"Failed to send status update notification: {e}")

        return decision


    def delete_decision(self, decision_id: int, user: Optional[User] = None) -> None:
        """Delete a decision and all related data."""
        decision = self.decision_repo.get_by_id(decision_id)
        if not decision:
            raise NotFoundException(f"Decision with ID {decision_id} not found")
        title = decision.title
        self.decision_repo.delete(decision)
        logger.info(f"Decision {decision_id} deleted")

        if user:
            self.audit_service.log_decision_deleted(user_id=user.id, decision_id=decision_id, title=title)

    def get_categories(self) -> List[str]:
        """Get all unique decision categories."""
        return self.decision_repo.get_categories()

    def count_decisions(self) -> int:
        """Get total decision count."""
        return self.decision_repo.count()
