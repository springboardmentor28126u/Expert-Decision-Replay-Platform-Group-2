from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app import models,schemas
from app.security import verify_password, hash_password
from app.models import VersionTracking
from app.email_service import send_email


def create_version(
    db,
    decision_id,
    changed_by,
    summary
):

    latest = db.query(VersionTracking)\
        .filter(
            VersionTracking.decision_id == decision_id
        )\
        .order_by(
            VersionTracking.version_number.desc()
        )\
        .first()

    version = 1

    if latest:
        version = latest.version_number + 1

    record = VersionTracking(
        decision_id=decision_id,
        version_number=version,
        changed_by=changed_by,
        change_summary=summary
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def get_versions(db, decision_id):

    versions = (
        db.query(VersionTracking)
        .filter(VersionTracking.decision_id == decision_id)
        .order_by(VersionTracking.version_number.desc())
        .all()
    )

    result = []

    for version in versions:

        user = db.query(models.User).filter(
            models.User.id == version.changed_by
        ).first()

        result.append({

            "id": version.id,

            "decision_id": version.decision_id,

            "version_number": version.version_number,

            "changed_by": version.changed_by,

            "changed_by_name": user.full_name if user else "Unknown",

            "change_summary": version.change_summary,

            "created_at": version.created_at

        })

    return result


# ======================================================
# USER CRUD
# ======================================================

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(
        models.User.email == email
    ).first()

def authenticate_user(db: Session, employee_id: str, password: str):

    user = db.query(models.User).filter(
        models.User.employee_id == employee_id
    ).first()

    if not user:
        return None

    if not verify_password(password, user.password):
        return None

    return user


def create_user(db: Session, user):

    # Check Email

    existing_email = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_email:
        return None

    # Check Employee ID

    existing_employee = db.query(models.User).filter(
        models.User.employee_id == user.employee_id
    ).first()

    if existing_employee:
        return None

    # Hash Password

    hashed_password = hash_password(
        user.password
    )

    # Hash Security Answer

    hashed_answer = hash_password(
        user.security_answer.lower()
    )

    db_user = models.User(

        employee_id=user.employee_id,

        full_name=user.full_name,

        email=user.email,

        password=hashed_password,

        role=user.role,

        department=user.department,

        security_question=user.security_question,

        security_answer=hashed_answer

    )

    db.add(db_user)

    db.commit()

    db.refresh(db_user)

    return db_user
# ======================================================
# ADMIN CREATE USER
# ======================================================

def admin_create_user(
    db: Session,
    user
):

    existing_email = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_email:
        return None

    existing_employee = db.query(models.User).filter(
        models.User.employee_id == user.employee_id
    ).first()

    if existing_employee:
        return None

    hashed_password = hash_password(
        user.password
    )

    hashed_answer = hash_password(
        user.security_answer.lower()
    )

    db_user = models.User(

        employee_id=user.employee_id,

        full_name=user.full_name,

        email=user.email,

        password=hashed_password,

        role=user.role,

        department=user.department,

        security_question=user.security_question,

        security_answer=hashed_answer,

        is_active=user.is_active

    )

    db.add(db_user)

    db.commit()

    db.refresh(db_user)

    return db_user


# ======================================================
# DECISION CRUD
# ======================================================

def create_decision(db: Session, decision, current_user):

    db_decision = models.Decision(
        title=decision.title,
        problem_statement=decision.problem_statement,
        category=decision.category,
        department=decision.department,
        priority=decision.priority,
        status="Draft",
        created_by=current_user.id
    )

    db.add(db_decision)
    db.commit()
    db.refresh(db_decision)
    create_audit_log(
    db=db,
    user=current_user,
    module="Decision Management",
    action="Create Decision",
    description=f"Created decision '{db_decision.title}'",
    entity_id=db_decision.id
)

    print("Decision saved:", db_decision.id)

    try:

        approval = models.Approval(
            decision_id=db_decision.id,
            approver_id=current_user.id,
            status="Pending",
            comments="",
            due_date=datetime.now() + timedelta(hours=24)      
         )
        db.add(approval)
        db.commit()
        db.refresh(approval)

        print("Approval saved:", approval.id)
        # ==========================================
        # Create Notification
        # ==========================================

        create_notification(
            db=db,
            user_id=current_user.id,
            title="Decision Created",
            message=f"Decision '{db_decision.title}' was created successfully."
        )

    except Exception as e:

        db.rollback()

        print("Approval Error:", e)

    return db_decision

def get_all_decisions(db: Session):

    decisions = db.query(models.Decision).all()

    result = []

    for decision in decisions:

        result.append({

            "id": decision.id,

            "title": decision.title,

            "problem_statement": decision.problem_statement,

            "category": decision.category,

            "department": decision.department,

            "priority": decision.priority,

            "status": decision.status,

            "created_by": decision.created_by,

            "owner_name": decision.owner.full_name,

            "created_at": decision.created_at,

            "updated_at": decision.updated_at

        })

    return result


def get_decision_by_id(db: Session, decision_id: int):

    decision = db.query(models.Decision).filter(
        models.Decision.id == decision_id
    ).first()

    if not decision:
        return None

    return {
        "id": decision.id,
        "title": decision.title,
        "problem_statement": decision.problem_statement,
        "category": decision.category,
        "department": decision.department,
        "priority": decision.priority,
        "status": decision.status,
        "created_by": decision.created_by,
        "owner_name": decision.owner.full_name,
        "created_at": decision.created_at,
        "updated_at": decision.updated_at
    }


# ======================================================
# DECISION CRUD
# ======================================================

def create_decision(db: Session, decision, current_user):

    db_decision = models.Decision(
        title=decision.title,
        problem_statement=decision.problem_statement,
        category=decision.category,
        department=decision.department,
        priority=decision.priority,
        status="Draft",
        created_by=current_user.id
    )

    db.add(db_decision)
    db.commit()
    db.refresh(db_decision)

    create_audit_log(
        db=db,
        user=current_user,
        module="Decision Management",
        action="Create Decision",
        description=f"Created decision '{db_decision.title}'",
        entity_id=db_decision.id
    )
    # ==========================================
    # Create Notification
    # ==========================================

    create_notification(
        db=db,
        user_id=current_user.id,
        title="Decision Created",
        message=f"Decision '{db_decision.title}' was created successfully."
    )

    print("Decision saved:", db_decision.id)

    try:
        approval = models.Approval(
            decision_id=db_decision.id,
            approver_id=current_user.id,
            status="Pending",
            comments=""
        )

        db.add(approval)
        db.commit()
        db.refresh(approval)

        print("Approval saved:", approval.id)

    except Exception as e:
        db.rollback()
        print("Approval Error:", e)

    return db_decision


def get_all_decisions(db: Session):

    decisions = db.query(models.Decision).all()

    result = []

    for decision in decisions:

        result.append({
            "id": decision.id,
            "title": decision.title,
            "problem_statement": decision.problem_statement,
            "category": decision.category,
            "department": decision.department,
            "priority": decision.priority,
            "status": decision.status,
            "created_by": decision.created_by,
            "owner_name": decision.owner.full_name,
            "created_at": decision.created_at,
            "updated_at": decision.updated_at
        })

    return result


def get_decision_by_id(db: Session, decision_id: int):

    decision = db.query(models.Decision).filter(
        models.Decision.id == decision_id
    ).first()

    if not decision:
        return None

    return {
        "id": decision.id,
        "title": decision.title,
        "problem_statement": decision.problem_statement,
        "category": decision.category,
        "department": decision.department,
        "priority": decision.priority,
        "status": decision.status,
        "created_by": decision.created_by,
        "owner_name": decision.owner.full_name,
        "created_at": decision.created_at,
        "updated_at": decision.updated_at
    }


def update_decision(
    db: Session,
    decision_id: int,
    decision,
    current_user
):

    db_decision = db.query(models.Decision).filter(
        models.Decision.id == decision_id
    ).first()

    if not db_decision:
        return None

    # ==========================================
    # Build Version Change Summary
    # ==========================================

    changes = []

    if decision.title is not None and decision.title != db_decision.title:
        changes.append(
            f"Title: {db_decision.title} → {decision.title}"
        )
        db_decision.title = decision.title

    if (
        decision.problem_statement is not None
        and decision.problem_statement != db_decision.problem_statement
    ):
        changes.append(
            "Problem Statement Updated"
        )
        db_decision.problem_statement = decision.problem_statement

    if (
        decision.category is not None
        and decision.category != db_decision.category
    ):
        changes.append(
            f"Category: {db_decision.category} → {decision.category}"
        )
        db_decision.category = decision.category

    if (
        decision.department is not None
        and decision.department != db_decision.department
    ):
        changes.append(
            f"Department: {db_decision.department} → {decision.department}"
        )
        db_decision.department = decision.department

    if (
        decision.priority is not None
        and decision.priority != db_decision.priority
    ):
        changes.append(
            f"Priority: {db_decision.priority} → {decision.priority}"
        )
        db_decision.priority = decision.priority

    if (
        decision.status is not None
        and decision.status != db_decision.status
    ):
        changes.append(
            f"Status: {db_decision.status} → {decision.status}"
        )
        db_decision.status = decision.status

    db.commit()
    db.refresh(db_decision)

    # ==========================================
    # Version History
    # ==========================================

    summary = (
        "\n".join(changes)
        if changes
        else "No changes made."
    )

    create_version(
        db=db,
        decision_id=db_decision.id,
        changed_by=current_user.id,
        summary=summary
    )

    # ==========================================
    # Audit Log
    # ==========================================

    create_audit_log(
        db=db,
        user=current_user,
        module="Decision Management",
        action="Update Decision",
        description=f"Updated decision '{db_decision.title}'",
        entity_id=db_decision.id
    )

    create_notification(
        db=db,
        user_id=current_user.id,
        title="Decision Updated",
        message=f"Decision '{db_decision.title}' was updated successfully."
    )

    return db_decision


def delete_decision(
    db: Session,
    decision_id: int,
    current_user
):

    db_decision = (
        db.query(models.Decision)
        .filter(models.Decision.id == decision_id)
        .first()
    )

    if not db_decision:
        return None

    decision_title = db_decision.title

    try:

        # ---------------------------------------------
        # Delete dependent records first
        # ---------------------------------------------

        db.query(models.VersionTracking).filter(
            models.VersionTracking.decision_id == decision_id
        ).delete(synchronize_session=False)

        db.query(models.Attachment).filter(
            models.Attachment.decision_id == decision_id
        ).delete(synchronize_session=False)

        # These are already configured with
        # cascade="all, delete", but deleting explicitly
        # keeps the operation predictable.
        db.query(models.Discussion).filter(
            models.Discussion.decision_id == decision_id
        ).delete(synchronize_session=False)

        db.query(models.Approval).filter(
            models.Approval.decision_id == decision_id
        ).delete(synchronize_session=False)

        db.query(models.AlternativeAnalysis).filter(
            models.AlternativeAnalysis.decision_id == decision_id
        ).delete(synchronize_session=False)

        # ---------------------------------------------
        # Delete the decision
        # ---------------------------------------------

        db.delete(db_decision)

        db.commit()

        # ---------------------------------------------
        # Audit log
        # ---------------------------------------------

        create_audit_log(
            db=db,
            user=current_user,
            module="Decision Management",
            action="Delete Decision",
            description=f"Deleted decision '{decision_title}'",
            entity_id=decision_id
        )

        return db_decision

    except Exception as e:

        db.rollback()

        print(
            f"Delete decision failed: {e}"
        )

        raise
# ======================================================
# APPROVAL CRUD
# ======================================================

def create_approval(db: Session, approval, approver_id: int):

    db_approval = models.Approval(
        decision_id=approval.decision_id,
        approver_id=approver_id,
        comments=approval.comments,
        status="Pending",
        due_date=approval.due_date
    )

    db.add(db_approval)
    db.commit()
    db.refresh(db_approval)

    # Get related decision
    decision = db.query(models.Decision).filter(
        models.Decision.id == approval.decision_id
    ).first()

    # Audit Log
    if decision:

        user = db.query(models.User).filter(
            models.User.id == approver_id
        ).first()

        if user:

            create_audit_log(
                db=db,
                user=user,
                module="Approval Management",
                action="Create Approval",
                description=(
                    f"Created approval for decision "
                    f"'{decision.title}'"
                ),
                entity_id=db_approval.id
            )

    return db_approval
def get_all_approvals(db: Session):
    return db.query(models.Approval).all()


def get_approval_by_id(db: Session, approval_id: int):

    return db.query(models.Approval).filter(
        models.Approval.id == approval_id
    ).first()


def get_approvals_by_decision(db: Session, decision_id: int):

    return db.query(models.Approval).filter(
        models.Approval.decision_id == decision_id
    ).all()


def update_approval(
    db: Session,
    approval_id: int,
    approval,
    current_user
):

    db_approval = get_approval_by_id(db, approval_id)

    if not db_approval:
        return None

    db_approval.status = approval.status
    db_approval.comments = approval.comments
    db_approval.approved_at = datetime.utcnow()

    decision = db.query(models.Decision).filter(
        models.Decision.id == db_approval.decision_id
    ).first()

    if decision:
        decision.status = approval.status

    db.commit()
    db.refresh(db_approval)

    create_audit_log(
        db=db,
        user=current_user,
        module="Approval Management",
        action=f"{approval.status} Decision",
        description=f"{approval.status} decision '{decision.title}'",
        entity_id=decision.id
    )

    # ==========================================
    # Notification
    # ==========================================

    if approval.status == "Approved":

        create_notification(
            db=db,
            user_id=decision.created_by,
            title="Decision Approved",
            message=f"Your decision '{decision.title}' has been approved."
        )

    elif approval.status == "Rejected":

        create_notification(
            db=db,
            user_id=decision.created_by,
            title="Decision Rejected",
            message=f"Your decision '{decision.title}' has been rejected."
        )

    return db_approval
def delete_approval(
    db: Session,
    approval_id: int,
    current_user
):

    db_approval = get_approval_by_id(
        db,
        approval_id
    )

    if not db_approval:
        return None

    decision = db.query(models.Decision).filter(
        models.Decision.id == db_approval.decision_id
    ).first()

    decision_title = (
        decision.title
        if decision
        else f"Decision #{db_approval.decision_id}"
    )

    db.delete(db_approval)
    db.commit()

    # Audit Log
    create_audit_log(
        db=db,
        user=current_user,
        module="Approval Management",
        action="Delete Approval",
        description=(
            f"Deleted approval #{approval_id} "
            f"for decision '{decision_title}'"
        ),
        entity_id=approval_id
    )

    return db_approval
# ======================================================
# APPROVAL ESCALATION
# ======================================================

def escalate_overdue_approvals(
    db: Session,
    current_user,
    escalation_hours: int = 24
):

    # --------------------------------------------------
    # Use timezone-naive UTC consistently
    # --------------------------------------------------

    now = datetime.utcnow()

    cutoff_time = now - timedelta(
        hours=escalation_hours
    )

    # --------------------------------------------------
    # Get pending and non-escalated approvals
    # --------------------------------------------------

    approvals = (
        db.query(models.Approval)
        .filter(
            models.Approval.status == "Pending",
            models.Approval.escalated == False
        )
        .all()
    )

    escalated_count = 0

    # ==================================================
    # PROCESS EACH APPROVAL
    # ==================================================

    for approval in approvals:

        is_overdue = False

        # --------------------------------------------------
        # Check explicit due date
        # --------------------------------------------------

        if approval.due_date:

            due_date = approval.due_date

            # Convert timezone-aware datetime
            # to timezone-naive datetime
            if due_date.tzinfo is not None:
                due_date = due_date.replace(
                    tzinfo=None
                )

            if due_date <= now:
                is_overdue = True

        # --------------------------------------------------
        # Fallback: created_at + escalation_hours
        # --------------------------------------------------

        else:

            created_at = approval.created_at

            if created_at and created_at.tzinfo is not None:
                created_at = created_at.replace(
                    tzinfo=None
                )

            if created_at and created_at <= cutoff_time:
                is_overdue = True

        # --------------------------------------------------
        # Skip if approval is not overdue
        # --------------------------------------------------

        if not is_overdue:
            continue

        # --------------------------------------------------
        # Get related decision
        # --------------------------------------------------

        decision = (
            db.query(models.Decision)
            .filter(
                models.Decision.id == approval.decision_id
            )
            .first()
        )

        if not decision:
            continue

        # --------------------------------------------------
        # Get decision owner
        # --------------------------------------------------

        decision_owner = (
            db.query(models.User)
            .filter(
                models.User.id == decision.created_by
            )
            .first()
        )

        # --------------------------------------------------
        # Mark approval as escalated
        # --------------------------------------------------

        approval.escalated = True
        approval.escalated_at = now

        # --------------------------------------------------
        # Create in-app notification
        # --------------------------------------------------

        create_notification(
            db=db,
            user_id=decision.created_by,
            title="Approval Escalated",
            message=(
                f"Approval for decision "
                f"'{decision.title}' has been escalated "
                f"because it is overdue."
            )
        )

        # ==================================================
        # SEND EMAIL NOTIFICATION
        # ==================================================

        if decision_owner and decision_owner.email:

            email_subject = (
                f"Approval Escalated - {decision.title}"
            )

            email_body = f"""
Hello {decision_owner.full_name},

An approval associated with the following decision
has been escalated because it is overdue.

Decision:
{decision.title}

Approval ID:
{approval.id}

Decision ID:
{decision.id}

Current Status:
{approval.status}

Reason:
The approval deadline has been exceeded.

Please review the approval in the
Expert Decision Replay Platform.

Regards,
Expert Decision Replay Platform
"""

            email_sent = send_email(
                to_email=decision_owner.email,
                subject=email_subject,
                body=email_body
            )

            if email_sent:
                print(
                    f"Escalation email sent to "
                    f"{decision_owner.email}"
                )
            else:
                print(
                    f"Escalation email could not be sent to "
                    f"{decision_owner.email}"
                )

        else:

            print(
                f"No email address found for decision owner "
                f"of decision #{decision.id}"
            )

        # ==================================================
        # CREATE AUDIT LOG
        # ==================================================

        create_audit_log(
            db=db,
            user=current_user,
            module="Approval Management",
            action="Escalate Approval",
            description=(
                f"Approval #{approval.id} for decision "
                f"'{decision.title}' was escalated because "
                f"the approval deadline was exceeded."
            ),
            entity_id=approval.id
        )

        escalated_count += 1

    # --------------------------------------------------
    # Save all escalation changes
    # --------------------------------------------------

    db.commit()

    return escalated_count
# ======================================================
# DISCUSSION CRUD
# ======================================================

def create_discussion(
    db: Session,
    discussion,
    current_user
):

    db_discussion = models.Discussion(
        decision_id=discussion.decision_id,
        user_id=current_user.id,
        comment=discussion.comment
    )

    db.add(db_discussion)
    db.commit()
    db.refresh(db_discussion)

    create_audit_log(
        db=db,
        user=current_user,
        module="Discussion",
        action="Create Comment",
        description=f"Added a comment to Decision #{discussion.decision_id}",
        entity_id=db_discussion.id
    )

    return db_discussion


def get_all_discussions(db: Session):
    return db.query(models.Discussion).all()


def get_discussion_by_id(db: Session, discussion_id: int):

    return db.query(models.Discussion).filter(
        models.Discussion.id == discussion_id
    ).first()


def get_discussions_by_decision(db: Session, decision_id: int):

    return db.query(models.Discussion).filter(
        models.Discussion.decision_id == decision_id
    ).all()


def update_discussion(
    db: Session,
    discussion_id: int,
    discussion,
    current_user
):

    db_discussion = get_discussion_by_id(
        db,
        discussion_id
    )

    if not db_discussion:
        return None

    db_discussion.comment = discussion.comment

    db.commit()
    db.refresh(db_discussion)

    create_audit_log(
        db=db,
        user=current_user,
        module="Discussion",
        action="Update Comment",
        description=f"Updated discussion comment for Decision #{db_discussion.decision_id}",
        entity_id=db_discussion.id
    )

    return db_discussion


def delete_discussion(
    db: Session,
    discussion_id: int,
    current_user
):

    db_discussion = get_discussion_by_id(
        db,
        discussion_id
    )

    if not db_discussion:
        return None

    decision_id = db_discussion.decision_id

    db.delete(db_discussion)
    db.commit()

    create_audit_log(
        db=db,
        user=current_user,
        module="Discussion",
        action="Delete Comment",
        description=f"Deleted discussion comment from Decision #{decision_id}",
        entity_id=discussion_id
    )

    return db_discussion
# ======================================================
# KNOWLEDGE REPOSITORY CRUD
# ======================================================

def create_knowledge(db: Session, knowledge, user_id: int):

    db_knowledge = models.KnowledgeRepository(
        title=knowledge.title,
        content=knowledge.content,
        category=knowledge.category,
        tags=knowledge.tags,
        created_by=user_id
    )

    db.add(db_knowledge)
    db.commit()
    db.refresh(db_knowledge)

    # Audit Log
    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if user:
        create_audit_log(
            db=db,
            user=user,
            module="Knowledge Repository",
            action="Create Article",
            description=(
                f"Created knowledge article "
                f"'{db_knowledge.title}'"
            ),
            entity_id=db_knowledge.id
        )

    return db_knowledge

def get_all_knowledge(db: Session):
    return db.query(models.KnowledgeRepository).all()


def get_knowledge_by_id(db: Session, knowledge_id: int):

    return db.query(models.KnowledgeRepository).filter(
        models.KnowledgeRepository.id == knowledge_id
    ).first()


def update_knowledge(
    db: Session,
    knowledge_id: int,
    knowledge,
    current_user
):

    db_knowledge = get_knowledge_by_id(
        db,
        knowledge_id
    )

    if not db_knowledge:
        return None

    if knowledge.title is not None:
        db_knowledge.title = knowledge.title

    if knowledge.content is not None:
        db_knowledge.content = knowledge.content

    if knowledge.category is not None:
        db_knowledge.category = knowledge.category

    if knowledge.tags is not None:
        db_knowledge.tags = knowledge.tags

    db.commit()
    db.refresh(db_knowledge)

    # Audit Log
    create_audit_log(
        db=db,
        user=current_user,
        module="Knowledge Repository",
        action="Update Article",
        description=(
            f"Updated knowledge article "
            f"'{db_knowledge.title}'"
        ),
        entity_id=db_knowledge.id
    )

    return db_knowledge
def delete_knowledge(
    db: Session,
    knowledge_id: int,
    current_user
):

    db_knowledge = get_knowledge_by_id(
        db,
        knowledge_id
    )

    if not db_knowledge:
        return None

    article_title = db_knowledge.title

    db.delete(db_knowledge)
    db.commit()

    # Audit Log
    create_audit_log(
        db=db,
        user=current_user,
        module="Knowledge Repository",
        action="Delete Article",
        description=(
            f"Deleted knowledge article "
            f"'{article_title}'"
        ),
        entity_id=knowledge_id
    )

    return db_knowledge

def search_knowledge(db: Session, keyword: str):

    return db.query(models.KnowledgeRepository).filter(
        models.KnowledgeRepository.title.ilike(f"%{keyword}%")
    ).all()


# ======================================================
# REPORTS & ANALYTICS CRUD
# ======================================================

def get_dashboard_summary(db: Session):

    total_users = db.query(models.User).count()

    total_decisions = db.query(models.Decision).count()

    draft_decisions = db.query(models.Decision).filter(
        models.Decision.status == "Draft"
    ).count()

    approved_decisions = db.query(models.Decision).filter(
        models.Decision.status == "Approved"
    ).count()

    rejected_decisions = db.query(models.Decision).filter(
        models.Decision.status == "Rejected"
    ).count()

    pending_approvals = db.query(models.Approval).filter(
        models.Approval.status == "Pending"
    ).count()

    total_discussions = db.query(models.Discussion).count()

    knowledge_articles = db.query(
        models.KnowledgeRepository
    ).count()

    return {

        "total_users": total_users,

        "total_decisions": total_decisions,

        "draft_decisions": draft_decisions,

        "approved_decisions": approved_decisions,

        "rejected_decisions": rejected_decisions,

        "pending_approvals": pending_approvals,

        "total_discussions": total_discussions,

        "knowledge_articles": knowledge_articles

    }
# ======================================================
# USER MANAGEMENT CRUD
# ======================================================

def get_all_users(db: Session):
    return db.query(models.User).all()


def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(
        models.User.id == user_id
    ).first()


def update_user(
    db: Session,
    user_id: int,
    user
):

    db_user = get_user_by_id(
        db,
        user_id
    )

    if not db_user:
        return None

    # Employee ID
    if user.employee_id is not None:
        db_user.employee_id = user.employee_id

    # Full name
    if user.full_name is not None:
        db_user.full_name = user.full_name

    # Email
    if user.email is not None:
        db_user.email = user.email

    # Department
    if user.department is not None:
        db_user.department = user.department

    # Role
    if user.role is not None:
        db_user.role = user.role

    # Active / Inactive
    if user.is_active is not None:
        db_user.is_active = user.is_active

    db.commit()

    db.refresh(db_user)

    return db_user
def delete_user(
    db: Session,
    user_id: int
):

    db_user = get_user_by_id(
        db,
        user_id
    )

    if not db_user:
        return None

    # -------------------------------------------------
    # Prevent deletion of Administrator
    # -------------------------------------------------

    if db_user.role == "Administrator":
        return None

    try:

        # =================================================
        # 1. DELETE DECISIONS OWNED BY THIS USER
        # =================================================

        user_decisions = (
            db.query(models.Decision)
            .filter(
                models.Decision.created_by == user_id
            )
            .all()
        )

        for decision in user_decisions:

            decision_id = decision.id

            # Delete version history
            db.query(models.VersionTracking).filter(
                models.VersionTracking.decision_id == decision_id
            ).delete(
                synchronize_session=False
            )

            # Delete attachments
            db.query(models.Attachment).filter(
                models.Attachment.decision_id == decision_id
            ).delete(
                synchronize_session=False
            )

            # Delete discussions
            db.query(models.Discussion).filter(
                models.Discussion.decision_id == decision_id
            ).delete(
                synchronize_session=False
            )

            # Delete approvals
            db.query(models.Approval).filter(
                models.Approval.decision_id == decision_id
            ).delete(
                synchronize_session=False
            )

            # Delete alternatives
            db.query(models.AlternativeAnalysis).filter(
                models.AlternativeAnalysis.decision_id == decision_id
            ).delete(
                synchronize_session=False
            )

            # Delete decision
            db.delete(decision)

        # =================================================
        # 2. DELETE APPROVALS CREATED BY USER
        # =================================================

        db.query(models.Approval).filter(
            models.Approval.approver_id == user_id
        ).delete(
            synchronize_session=False
        )

        # =================================================
        # 3. DELETE DISCUSSIONS CREATED BY USER
        # =================================================

        db.query(models.Discussion).filter(
            models.Discussion.user_id == user_id
        ).delete(
            synchronize_session=False
        )

        # =================================================
        # 4. DELETE KNOWLEDGE ARTICLES CREATED BY USER
        # =================================================

        db.query(models.KnowledgeRepository).filter(
            models.KnowledgeRepository.created_by == user_id
        ).delete(
            synchronize_session=False
        )

        # =================================================
        # 5. DELETE VERSION HISTORY CREATED BY USER
        # =================================================

        db.query(models.VersionTracking).filter(
            models.VersionTracking.changed_by == user_id
        ).delete(
            synchronize_session=False
        )

        # =================================================
        # 6. DELETE AUDIT LOGS CREATED BY USER
        # =================================================

        db.query(models.AuditLog).filter(
            models.AuditLog.user_id == user_id
        ).delete(
            synchronize_session=False
        )

        # =================================================
        # 7. DELETE NOTIFICATIONS
        # =================================================

        db.query(models.Notification).filter(
            models.Notification.user_id == user_id
        ).delete(
            synchronize_session=False
        )

        # =================================================
        # 8. DELETE ATTACHMENTS UPLOADED BY USER
        # =================================================

        db.query(models.Attachment).filter(
            models.Attachment.uploaded_by == user_id
        ).delete(
            synchronize_session=False
        )

        # =================================================
        # 9. DELETE USER
        # =================================================

        db.delete(db_user)

        db.commit()

        return db_user

    except Exception as e:

        db.rollback()

        print(
            f"Delete user failed: {e}"
        )

        raise
# ======================================================
# PROFILE CRUD
# ======================================================

def update_profile(
    db: Session,
    user_id: int,
    profile
):

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not user:
        return None

    if profile.full_name is not None:
        user.full_name = profile.full_name


    if hasattr(profile, "department") and profile.department is not None:
        user.department = profile.department

    db.commit()

    db.refresh(user)

    return user


# ======================================================
# CHANGE PASSWORD
# ======================================================

def change_password(
    db: Session,
    user_id: int,
    password_data
):

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not user:
        return False

    if not verify_password(

        password_data.current_password,

        user.password

    ):

        return False

    user.password = hash_password(

        password_data.new_password

    )

    db.commit()

    return True
# ======================================================
# FORGOT PASSWORD
# ======================================================

def reset_password(
    db: Session,
    employee_id: str,
    email: str,
    new_password: str
):

    user = db.query(models.User).filter(
        models.User.employee_id == employee_id
    ).first()

    if not user:
        return False

    if user.email != email:
        return False

    user.password = hash_password(
        new_password
    )

    db.commit()

    return True
def verify_forgot_password(
    db: Session,
    data
):

    user = db.query(models.User).filter(
        models.User.employee_id == data.employee_id
    ).first()

    if not user:
        return False

    if user.email != data.email:
        return False

    if user.security_question != data.security_question:
        return False

    if not verify_password(
        data.security_answer.lower(),
        user.security_answer
    ):
        return False

    return True
# =====================================================
# CHECK DECISION OWNER
# =====================================================

def is_decision_owner(

    db: Session,

    decision_id: int,

    user_id: int

):

    decision = db.query(models.Decision).filter(

        models.Decision.id == decision_id

    ).first()

    if not decision:

        return False

    return decision.created_by == user_id
# =====================================================
# CHECK DISCUSSION OWNER
# =====================================================

def is_discussion_owner(

    db: Session,

    discussion_id: int,

    user_id: int

):

    discussion = db.query(
        models.Discussion
    ).filter(

        models.Discussion.id == discussion_id

    ).first()

    if not discussion:

        return False

    return discussion.user_id == user_id
# =====================================================
# CHECK KNOWLEDGE OWNER
# =====================================================

def is_knowledge_owner(

    db: Session,

    knowledge_id: int,

    user_id: int

):

    knowledge = db.query(
        models.KnowledgeRepository
    ).filter(

        models.KnowledgeRepository.id == knowledge_id

    ).first()

    if not knowledge:

        return False

    return knowledge.created_by == user_id
# =====================================================
# AUDIT LOG CRUD
# =====================================================

def create_audit_log(
    db: Session,
    user,
    module: str,
    action: str,
    description: str,
    entity_id: int | None = None
):

    log = models.AuditLog(

        user_id=user.id,

        username=user.full_name,

        role=user.role,

        module=module,

        action=action,

        description=description,

        entity_id=entity_id

    )

    db.add(log)

    db.commit()

    db.refresh(log)

    return log


def get_all_audit_logs(db: Session):

    return db.query(
        models.AuditLog
    ).order_by(
        models.AuditLog.created_at.desc()
    ).all()


def get_audit_logs_by_user(
    db: Session,
    user_id: int
):

    return db.query(
        models.AuditLog
    ).filter(
        models.AuditLog.user_id == user_id
    ).order_by(
        models.AuditLog.created_at.desc()
    ).all()
# =====================================================
# NOTIFICATION CRUD
# =====================================================

from app.models import Notification


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str
):

    print("========== CREATE NOTIFICATION ==========")
    print("User ID :", user_id)
    print("Title   :", title)
    print("Message :", message)

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message
    )

    print("Notification object created")

    db.add(notification)

    print("Before Commit")

    db.commit()

    print("After Commit")

    db.refresh(notification)

    print("Notification Saved with ID:", notification.id)

    return notification

def get_notifications(
    db: Session,
    user_id: int
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )


def mark_notification_read(
    db: Session,
    notification_id: int,
    user_id: int
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        )
        .first()
    )

    if notification:
        notification.is_read = True
        db.commit()
        db.refresh(notification)

    return notification


def delete_notification(
    db: Session,
    notification_id: int,
    user_id: int
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        )
        .first()
    )

    if notification:
        db.delete(notification)
        db.commit()

    return notification
# =====================================================
# ATTACHMENT CRUD
# =====================================================

def create_attachment(
    db: Session,
    decision_id: int,
    uploaded_by: int,
    file_name: str,
    file_path: str,
    file_type: str = None,
    file_size: int = None
):
    attachment = models.Attachment(
        decision_id=decision_id,
        uploaded_by=uploaded_by,
        file_name=file_name,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size
    )

    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return attachment


def get_attachments_by_decision(
    db: Session,
    decision_id: int
):
    return (
        db.query(models.Attachment)
        .filter(
            models.Attachment.decision_id == decision_id
        )
        .order_by(
            models.Attachment.created_at.desc()
        )
        .all()
    )


def get_attachment_by_id(
    db: Session,
    attachment_id: int
):
    return (
        db.query(models.Attachment)
        .filter(
            models.Attachment.id == attachment_id
        )
        .first()
    )


def delete_attachment(
    db: Session,
    attachment_id: int
):
    attachment = get_attachment_by_id(
        db,
        attachment_id
    )

    if not attachment:
        return None

    db.delete(attachment)
    db.commit()

    return attachment