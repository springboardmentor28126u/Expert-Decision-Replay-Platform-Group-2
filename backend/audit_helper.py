from sqlalchemy.orm import Session
from models import AuditLog

def log_audit(
    db: Session,
    log_type: str,
    action: str,
    entity_type: str,
    entity_id: int | None,
    user_id: int,
    details: str | None = None,
    commit: bool = True,
) -> AuditLog:
    """
    Creates and saves an audit log entry.
    """
    log_entry = AuditLog(
        user_id=user_id,
        log_type=log_type,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(log_entry)
    if commit:
        db.commit()
        db.refresh(log_entry)
    return log_entry

def log_activity(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: int | None,
    user_id: int,
    details: str | None = None,
    commit: bool = True,
) -> AuditLog:
    return log_audit(db, "activity", action, entity_type, entity_id, user_id, details, commit)

def log_security(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: int | None,
    user_id: int,
    details: str | None = None,
    commit: bool = True,
) -> AuditLog:
    return log_audit(db, "security", action, entity_type, entity_id, user_id, details, commit)

def log_access(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: int | None,
    user_id: int,
    details: str | None = None,
    commit: bool = True,
) -> AuditLog:
    return log_audit(db, "access", action, entity_type, entity_id, user_id, details, commit)
