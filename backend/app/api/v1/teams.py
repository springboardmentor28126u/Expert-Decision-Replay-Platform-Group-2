"""
Expert Decision Replay Platform - Teams Router

Endpoints for team management.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.session import get_db
from app.schemas.team import TeamResponse, TeamCreate, TeamUpdate
from app.schemas.common import MessageResponse
from app.services.team_service import TeamService
from app.api.deps import get_current_user, require_role
from app.models.user import UserRole

router = APIRouter()


@router.get("", response_model=List[TeamResponse])
def list_teams(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List all teams."""
    return TeamService.get_teams(db)


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.ADMIN)),
):
    """Create a new team (Admin only)."""
    return TeamService.create_team(db, team_data)


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific team by ID."""
    return TeamService.get_team_by_id(db, team_id)


@router.put("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: UUID,
    team_data: TeamUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.ADMIN)),
):
    """Update a team (Admin only)."""
    return TeamService.update_team(db, team_id, team_data)


@router.delete("/{team_id}", response_model=MessageResponse)
def delete_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.ADMIN)),
):
    """Delete a team (Admin only)."""
    TeamService.delete_team(db, team_id)
    return {"message": f"Team {team_id} successfully deleted"}
