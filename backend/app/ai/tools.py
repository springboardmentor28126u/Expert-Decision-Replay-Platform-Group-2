from sqlalchemy.orm import Session

from app.models import (
    Decision,
    Approval,
    Discussion,
    KnowledgeRepository,
    AlternativeAnalysis,
    VersionTracking,
    AuditLog
)


# =====================================================
# GET DECISION
# =====================================================

# =====================================================
# GET DECISION
# =====================================================

def get_decision(db: Session, decision_id: int):

    decision = (
        db.query(Decision)
        .filter(Decision.id == decision_id)
        .first()
    )

    if decision is None:
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
        "owner_name": decision.owner_name,
        "created_at": (
            str(decision.created_at)
            if decision.created_at
            else None
        ),
        "updated_at": (
            str(decision.updated_at)
            if decision.updated_at
            else None
        )
    }
# =====================================================
# GET ALTERNATIVES
# =====================================================

def get_alternatives(
    db: Session,
    decision_id: int
):

    alternatives = (
        db.query(AlternativeAnalysis)
        .filter(
            AlternativeAnalysis.decision_id == decision_id
        )
        .all()
    )

    return [
        {
            "id": alternative.id,
            "name": alternative.alternative_name,
            "description": alternative.description,
            "advantages": alternative.advantages,
            "disadvantages": alternative.disadvantages,
            "estimated_cost": alternative.estimated_cost,
            "risk_level": alternative.risk_level,
            "score": alternative.score
        }
        for alternative in alternatives
    ]


# =====================================================
# GET APPROVALS
# =====================================================

def get_approvals(
    db: Session,
    decision_id: int | None = None
):

    query = db.query(Approval)

    if decision_id is not None:
        query = query.filter(
            Approval.decision_id == decision_id
        )

    approvals = query.all()

    return [
        {
            "id": approval.id,
            "decision_id": approval.decision_id,
            "approver_id": approval.approver_id,
            "status": approval.status,
            "comments": approval.comments,
            "due_date": str(approval.due_date)
                if approval.due_date else None,
            "escalated": approval.escalated,
            "escalated_at": str(approval.escalated_at)
                if approval.escalated_at else None,
            "created_at": str(approval.created_at)
        }
        for approval in approvals
    ]


# =====================================================
# GET DISCUSSIONS
# =====================================================

def get_discussions(
    db: Session,
    decision_id: int
):

    discussions = (
        db.query(Discussion)
        .filter(
            Discussion.decision_id == decision_id
        )
        .order_by(Discussion.created_at)
        .all()
    )

    return [
        {
            "id": discussion.id,
            "decision_id": discussion.decision_id,
            "user_id": discussion.user_id,
            "comment": discussion.comment,
            "created_at": str(discussion.created_at)
        }
        for discussion in discussions
    ]


# =====================================================
# SEARCH KNOWLEDGE
# =====================================================

def search_knowledge(
    db: Session,
    search_term: str
):

    pattern = f"%{search_term}%"

    articles = (
        db.query(KnowledgeRepository)
        .filter(
            KnowledgeRepository.title.ilike(pattern)
            |
            KnowledgeRepository.content.ilike(pattern)
            |
            KnowledgeRepository.tags.ilike(pattern)
        )
        .all()
    )

    return [
        {
            "id": article.id,
            "title": article.title,
            "content": article.content,
            "category": article.category,
            "tags": article.tags,
            "created_by": article.created_by,
            "created_at": str(article.created_at)
        }
        for article in articles
    ]


# =====================================================
# GET VERSION HISTORY
# =====================================================

def get_versions(
    db: Session,
    decision_id: int
):

    versions = (
        db.query(VersionTracking)
        .filter(
            VersionTracking.decision_id == decision_id
        )
        .order_by(
            VersionTracking.version_number
        )
        .all()
    )

    return [
        {
            "id": version.id,
            "decision_id": version.decision_id,
            "version_number": version.version_number,
            "changed_by": version.changed_by,
            "change_summary": version.change_summary,
            "created_at": str(version.created_at)
        }
        for version in versions
    ]


# =====================================================
# GET AUDIT LOGS
# =====================================================

def get_audit_logs(
    db: Session,
    entity_id: int | None = None
):

    query = db.query(AuditLog)

    if entity_id is not None:
        query = query.filter(
            AuditLog.entity_id == entity_id
        )

    logs = (
        query
        .order_by(AuditLog.created_at.desc())
        .limit(100)
        .all()
    )

    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "username": log.username,
            "role": log.role,
            "module": log.module,
            "action": log.action,
            "entity_id": log.entity_id,
            "description": log.description,
            "created_at": str(log.created_at)
        }
        for log in logs
    ]