from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.version import VersionCreate, VersionResponse
from app.crud.version import (
    create_version,
    get_versions_by_decision,
    get_all_versions
)

router = APIRouter(
    prefix="/versions",
    tags=["Version Tracking"]
)


# -----------------------------------------
# Create Version
# -----------------------------------------
@router.post("/", response_model=VersionResponse)
def add_version(
    version: VersionCreate,
    db: Session = Depends(get_db)
):
    return create_version(db, version)


# -----------------------------------------
# Get ALL Versions (Dashboard Version History)
# -----------------------------------------
@router.get("/")
def get_all_version_history(
    db: Session = Depends(get_db)
):
    return get_all_versions(db)


# -----------------------------------------
# Get Versions of One Decision
# -----------------------------------------
@router.get("/{decision_id}", response_model=List[VersionResponse])
def get_version_history(
    decision_id: int,
    db: Session = Depends(get_db)
):
    return get_versions_by_decision(db, decision_id)