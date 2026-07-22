from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from uuid import UUID
from app.models.decision import Category, Decision, Alternative, Discussion, Attachment, DecisionVersion, Approval, Notification, AuditLog

from app.schemas.decision import CategoryCreate, DecisionCreate, DecisionUpdate, AlternativeCreate, AlternativeUpdate, DiscussionCreate

class CategoryService:
    @staticmethod
    def get_by_id(db: Session, cat_id: int) -> Optional[Category]:
        return db.query(Category).filter(Category.id == cat_id).first()

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Category]:
        return db.query(Category).filter(Category.name == name).first()

    @staticmethod
    def list(db: Session) -> List[Category]:
        return db.query(Category).all()

    @staticmethod
    def create(db: Session, cat_in: CategoryCreate) -> Category:
        db_cat = Category(name=cat_in.name, description=cat_in.description)
        db.add(db_cat)
        db.commit()
        db.refresh(db_cat)
        return db_cat


class DecisionService:
    @staticmethod
    def get_by_id(db: Session, decision_id: UUID) -> Optional[Decision]:
        return db.query(Decision).filter(Decision.id == decision_id).first()

    @staticmethod
    def list(
        db: Session,
        category_id: Optional[int] = None,
        team_id: Optional[UUID] = None,
        creator_id: Optional[UUID] = None,
        status: Optional[str] = None
    ) -> List[Decision]:
        query = db.query(Decision)
        if category_id is not None:
            query = query.filter(Decision.category_id == category_id)
        if team_id is not None:
            query = query.filter(Decision.team_id == team_id)
        if creator_id is not None:
            query = query.filter(Decision.creator_id == creator_id)
        if status is not None:
            query = query.filter(Decision.status == status)
        return query.order_by(Decision.created_at.desc()).all()

    @staticmethod
    def create(db: Session, decision_in: DecisionCreate, creator_id: UUID) -> Decision:
        db_decision = Decision(
            title=decision_in.title,
            problem_statement=decision_in.problem_statement,
            evaluation_criteria=decision_in.evaluation_criteria,
            category_id=decision_in.category_id,
            team_id=decision_in.team_id,
            creator_id=creator_id,
            version=1,
            status="draft"
        )
        db.add(db_decision)
        db.flush()  # to get db_decision.id for alternatives

        # Save alternatives if provided
        for alt_in in decision_in.alternatives:
            db_alt = Alternative(
                decision_id=db_decision.id,
                title=alt_in.title,
                description=alt_in.description,
                pros=alt_in.pros,
                cons=alt_in.cons,
                cost_estimate=alt_in.cost_estimate,
                feasibility_analysis=alt_in.feasibility_analysis,
                risk_assessment=alt_in.risk_assessment,
                is_chosen=alt_in.is_chosen
            )
            db.add(db_alt)

        # Log initial version (version = 1) in DecisionVersion
        db_version = DecisionVersion(
            decision_id=db_decision.id,
            title=db_decision.title,
            problem_statement=db_decision.problem_statement,
            evaluation_criteria=db_decision.evaluation_criteria,
            status=db_decision.status,
            category_id=db_decision.category_id,
            version=1,
            updated_by=creator_id
        )
        db.add(db_version)
        
        db.commit()
        db.refresh(db_decision)
        return db_decision

    @staticmethod
    def update(db: Session, db_decision: Decision, decision_update: DecisionUpdate, user_id: UUID) -> Decision:
        update_data = decision_update.model_dump(exclude_unset=True)
        
        # Check if fields affecting versioning are updated
        version_fields = ["title", "problem_statement", "evaluation_criteria", "status", "category_id"]
        version_changed = any(field in update_data for field in version_fields)
        
        for field, value in update_data.items():
            setattr(db_decision, field, value)
            
        if version_changed:
            db_decision.version += 1
            # Write a new record to DecisionVersion
            db_version = DecisionVersion(
                decision_id=db_decision.id,
                title=db_decision.title,
                problem_statement=db_decision.problem_statement,
                evaluation_criteria=db_decision.evaluation_criteria,
                status=db_decision.status,
                category_id=db_decision.category_id,
                version=db_decision.version,
                updated_by=user_id
            )
            db.add(db_version)

        db.commit()
        db.refresh(db_decision)
        return db_decision

    @staticmethod
    def delete(db: Session, db_decision: Decision) -> None:
        db.delete(db_decision)
        db.commit()


class AlternativeService:
    @staticmethod
    def get_by_id(db: Session, alt_id: UUID) -> Optional[Alternative]:
        return db.query(Alternative).filter(Alternative.id == alt_id).first()

    @staticmethod
    def create(db: Session, alt_in: AlternativeCreate, decision_id: UUID) -> Alternative:
        db_alt = Alternative(
            decision_id=decision_id,
            title=alt_in.title,
            description=alt_in.description,
            pros=alt_in.pros,
            cons=alt_in.cons,
            cost_estimate=alt_in.cost_estimate,
            feasibility_analysis=alt_in.feasibility_analysis,
            risk_assessment=alt_in.risk_assessment,
            is_chosen=alt_in.is_chosen
        )
        db.add(db_alt)
        db.commit()
        db.refresh(db_alt)
        return db_alt

    @staticmethod
    def update(db: Session, db_alt: Alternative, alt_in: AlternativeUpdate) -> Alternative:
        update_data = alt_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_alt, field, value)
        db.commit()
        db.refresh(db_alt)
        return db_alt

    @staticmethod
    def delete(db: Session, db_alt: Alternative) -> None:
        db.delete(db_alt)
        db.commit()


class DiscussionService:
    @staticmethod
    def get_by_id(db: Session, discussion_id: UUID) -> Optional[Discussion]:
        return db.query(Discussion).filter(Discussion.id == discussion_id).first()

    @staticmethod
    def create(db: Session, comment_in: DiscussionCreate, decision_id: UUID, user_id: UUID) -> Discussion:
        db_comment = Discussion(
            decision_id=decision_id,
            user_id=user_id,
            parent_id=comment_in.parent_id,
            content=comment_in.content,
            meeting_notes=comment_in.meeting_notes,
            decision_rationale=comment_in.decision_rationale
        )
        db.add(db_comment)
        db.commit()
        db.refresh(db_comment)
        return db_comment

    @staticmethod
    def list_by_decision(db: Session, decision_id: UUID) -> List[Discussion]:
        return db.query(Discussion).filter(Discussion.decision_id == decision_id).order_by(Discussion.created_at.asc()).all()


class AttachmentService:
    @staticmethod
    def create(
        db: Session,
        file_name: str,
        file_path: str,
        file_type: Optional[str],
        uploaded_by: UUID,
        decision_id: Optional[UUID] = None,
        discussion_id: Optional[UUID] = None
    ) -> Attachment:
        db_attach = Attachment(
            decision_id=decision_id,
            discussion_id=discussion_id,
            file_name=file_name,
            file_path=file_path,
            file_type=file_type,
            uploaded_by=uploaded_by
        )
        db.add(db_attach)
        db.commit()
        db.refresh(db_attach)
        return db_attach

    @staticmethod
    def get_by_id(db: Session, attachment_id: UUID) -> Optional[Attachment]:
        return db.query(Attachment).filter(Attachment.id == attachment_id).first()

    @staticmethod
    def list_by_decision(db: Session, decision_id: UUID) -> List[Attachment]:
        return db.query(Attachment).filter(Attachment.decision_id == decision_id).all()

class ApprovalService:
    @staticmethod
    def get_by_id(db: Session, approval_id: UUID) -> Optional[Approval]:
        return db.query(Approval).filter(Approval.id == approval_id).first()

    @staticmethod
    def list_by_decision(db: Session, decision_id: UUID) -> List[Approval]:
        return db.query(Approval).filter(Approval.decision_id == decision_id).order_by(Approval.assigned_at.asc()).all()

    @staticmethod
    def list_pending_by_reviewer(db: Session, reviewer_id: UUID) -> List[Approval]:
        return db.query(Approval).filter(Approval.reviewer_id == reviewer_id, Approval.status == "pending").all()

    @staticmethod
    def assign_reviewer(db: Session, decision_id: UUID, reviewer_id: UUID, stage: int = 1) -> Approval:
        db_approval = Approval(
            decision_id=decision_id,
            reviewer_id=reviewer_id,
            stage=stage,
            status="pending"
        )
        db.add(db_approval)
        db.commit()
        db.refresh(db_approval)
        
        # Create notification for reviewer
        NotificationService.create(
            db,
            user_id=reviewer_id,
            title="Review Assigned",
            message=f"You have been assigned to review the decision: '{db_approval.decision.title}'."
        )
        
        return db_approval

    @staticmethod
    def action_approval(db: Session, db_approval: Approval, status: str, comments: Optional[str] = None) -> Approval:
        import datetime
        db_approval.status = status.lower()
        db_approval.comments = comments
        db_approval.actioned_at = datetime.datetime.utcnow()
        db.commit()

        # Retrieve the associated decision
        decision = db_approval.decision
        creator_id = decision.creator_id

        # Business Logic for status advancement
        if status.lower() == "rejected":
            decision.status = "rejected"
            db.commit()
            
            # Notify creator
            NotificationService.create(
                db,
                user_id=creator_id,
                title="Decision Rejected",
                message=f"Your decision proposal '{decision.title}' has been rejected by the reviewer."
            )
        elif status.lower() == "approved":
            # Check if all approvals in this stage are approved
            stage_approvals = db.query(Approval).filter(
                Approval.decision_id == decision.id,
                Approval.stage == db_approval.stage
            ).all()
            
            all_stage_approved = all(appr.status == "approved" for appr in stage_approvals)
            
            if all_stage_approved:
                # Check if there's any higher stage assigned
                higher_stage_exists = db.query(Approval).filter(
                    Approval.decision_id == decision.id,
                    Approval.stage > db_approval.stage
                ).first()
                
                if not higher_stage_exists:
                    # Final approval!
                    decision.status = "approved"
                    db.commit()
                    
                    # Notify creator
                    NotificationService.create(
                        db,
                        user_id=creator_id,
                        title="Decision Approved",
                        message=f"Congratulations! Your decision proposal '{decision.title}' has been fully approved."
                    )
                else:
                    # Advance to next stage (remains under_review, but notify next stage reviewers if assigned)
                    next_stage_approvals = db.query(Approval).filter(
                        Approval.decision_id == decision.id,
                        Approval.stage == db_approval.stage + 1
                    ).all()
                    
                    for na in next_stage_approvals:
                        NotificationService.create(
                            db,
                            user_id=na.reviewer_id,
                            title="Pending Review Active",
                            message=f"Stage {na.stage} review is now active for decision: '{decision.title}'."
                        )
                        
        db.commit()
        db.refresh(db_approval)
        return db_approval


class NotificationService:
    @staticmethod
    def create(db: Session, user_id: UUID, title: str, message: str) -> Notification:
        db_notif = Notification(user_id=user_id, title=title, message=message, is_read=False)
        db.add(db_notif)
        db.commit()
        db.refresh(db_notif)
        return db_notif

    @staticmethod
    def list_by_user(db: Session, user_id: UUID) -> List[Notification]:
        return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.is_read.asc(), Notification.created_at.desc()).all()

    @staticmethod
    def mark_as_read(db: Session, db_notif: Notification) -> Notification:
        db_notif.is_read = True
        db.commit()
        db.refresh(db_notif)
        return db_notif


class AuditLogService:
    @staticmethod
    def create(
        db: Session,
        user_id: Optional[UUID],
        action: str,
        entity_name: Optional[str] = None,
        entity_id: Optional[str] = None,
        old_values: Optional[str] = None,
        new_values: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        db_log = AuditLog(
            user_id=user_id,
            action=action,
            entity_name=entity_name,
            entity_id=entity_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log

    @staticmethod
    def list_logs(db: Session) -> List[AuditLog]:
        return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()

