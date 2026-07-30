from sqlalchemy.orm import Session

from app.models.version import Version
from app.models.decision import Decision
from app.schemas.version import VersionCreate


def create_version(db: Session, version: VersionCreate):

    new_version = Version(
        action=version.action,
        username=version.username,
        decision_id=version.decision_id
    )

    db.add(new_version)
    db.commit()
    db.refresh(new_version)

    return new_version


def get_versions_by_decision(db: Session, decision_id: int):

    return (
        db.query(Version)
        .filter(Version.decision_id == decision_id)
        .order_by(Version.created_at.desc())
        .all()
    )


def get_all_versions(db: Session):

    versions = (
        db.query(Version)
        .join(Decision, Version.decision_id == Decision.id)
        .order_by(Version.created_at.desc())
        .all()
    )

    result = []

    for version in versions:

        result.append({

            "id": version.id,

            "decision": version.decision.title,

            "status": version.decision.status,

            "action": version.action,

            "updated_by": version.username,

            "updated_at": version.created_at

        })

    return result