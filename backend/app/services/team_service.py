"""
Expert Decision Replay Platform - Team Service

Business logic for team management operations.
"""

from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.team import Team
from app.schemas.team import TeamCreate, TeamUpdate


class TeamService:

    @staticmethod
    def get_teams(db: Session) -> List[Team]:
        """Get all teams."""
        return db.query(Team).order_by(Team.name).all()

    @staticmethod
    def get_team_by_id(db: Session, team_id: UUID) -> Team:
        """Get a team by ID."""
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )
        return team

    @staticmethod
    def create_team(db: Session, team_data: TeamCreate) -> Team:
        """Create a new team."""
        existing = db.query(Team).filter(Team.name == team_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team name already exists",
            )

        new_team = Team(**team_data.model_dump())
        db.add(new_team)
        db.commit()
        db.refresh(new_team)
        return new_team

    @staticmethod
    def update_team(db: Session, team_id: UUID, team_data: TeamUpdate) -> Team:
        """Update a team."""
        team = TeamService.get_team_by_id(db, team_id)

        if team_data.name and team_data.name != team.name:
            existing = db.query(Team).filter(Team.name == team_data.name).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Team name already exists",
                )

        for key, value in team_data.model_dump(exclude_unset=True).items():
            setattr(team, key, value)

        db.commit()
        db.refresh(team)
        return team

    @staticmethod
    def delete_team(db: Session, team_id: UUID) -> None:
        """Delete a team."""
        team = TeamService.get_team_by_id(db, team_id)
        db.delete(team)
        db.commit()
