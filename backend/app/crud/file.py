from sqlalchemy.orm import Session

from app.models.file import File


def create_file_record(
    db: Session,
    decision_id: int,
    filename: str,
    filepath: str
):

    db_file = File(
        decision_id=decision_id,
        filename=filename,
        filepath=filepath
    )

    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return db_file


def get_files_by_decision(
    db: Session,
    decision_id: int
):

    return db.query(File).filter(
        File.decision_id == decision_id
    ).all()


def get_file_by_id(
    db: Session,
    file_id: int
):

    return db.query(File).filter(
        File.id == file_id
    ).first()


def delete_file(
    db: Session,
    db_file: File
):

    db.delete(db_file)
    db.commit()