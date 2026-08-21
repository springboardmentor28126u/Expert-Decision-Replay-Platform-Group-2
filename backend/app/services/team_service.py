"""
Expert Decision Replay Platform - Team Service

Business logic for team management operations.
All queries are scoped to a specific company.
"""

import logging
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.team import Team
from app.models.team_membership import TeamMembership, TeamMemberRole
from app.models.membership import Membership
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate, TeamMemberResponse, TeamMemberAdd

logger = logging.getLogger("expert_decision")


class TeamService:

    @staticmethod
    def get_teams(db: Session, company_id: UUID) -> List[Team]:
        """Get all teams for a company."""
        return db.query(Team).filter(Team.company_id == company_id).order_by(Team.name).all()

    @staticmethod
    def get_team_by_id(db: Session, team_id: UUID, company_id: UUID) -> Team:
        """Get a team by ID within a company."""
        team = db.query(Team).filter(Team.id == team_id, Team.company_id == company_id).first()
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )
        return team

    @staticmethod
    def create_team(db: Session, team_data: TeamCreate, company_id: UUID) -> Team:
        """Create a new team within a company."""
        existing = db.query(Team).filter(
            Team.name == team_data.name,
            Team.company_id == company_id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team name already exists in this company",
            )

        new_team = Team(**team_data.model_dump(), company_id=company_id)
        db.add(new_team)
        try:
            db.commit()
            db.refresh(new_team)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team name already exists in this company",
            )
        return new_team

    @staticmethod
    def update_team(db: Session, team_id: UUID, team_data: TeamUpdate, company_id: UUID) -> Team:
        """Update a team within a company."""
        team = TeamService.get_team_by_id(db, team_id, company_id)

        if team_data.name and team_data.name != team.name:
            existing = db.query(Team).filter(
                Team.name == team_data.name,
                Team.company_id == company_id,
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Team name already exists in this company",
                )

        for key, value in team_data.model_dump(exclude_unset=True).items():
            setattr(team, key, value)

        try:
            db.commit()
            db.refresh(team)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team name already exists in this company",
            )
        return team

    @staticmethod
    def delete_team(db: Session, team_id: UUID, company_id: UUID) -> None:
        """Delete a team within a company."""
        team = TeamService.get_team_by_id(db, team_id, company_id)
        db.delete(team)
        db.commit()

    # â”€â”€â”€ Team Membership Methods â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @staticmethod
    def list_team_members(db: Session, team_id: UUID, company_id: UUID) -> List[TeamMemberResponse]:
        """List all members of a team."""
        TeamService.get_team_by_id(db, team_id, company_id)  # Ensure team exists in company

        memberships = (
            db.query(TeamMembership)
            .filter(TeamMembership.team_id == team_id)
            .all()
        )

        # Batch-load users to avoid N+1 queries
        user_ids = [m.user_id for m in memberships]
        users = {}
        if user_ids:
            user_list = db.query(User).filter(User.id.in_(user_ids)).all()
            users = {u.id: u for u in user_list}

        result = []
        for m in memberships:
            user = users.get(m.user_id)
            if user:
                result.append(TeamMemberResponse(
                    id=user.id,
                    full_name=user.full_name,
                    email=user.email,
                    role=m.role.value,
                    joined_at=m.joined_at,
                ))
        return result

    @staticmethod
    def add_member_to_team(
        db: Session, team_id: UUID, data: TeamMemberAdd, company_id: UUID
    ) -> TeamMembership:
        """Add a user to a team."""
        team = TeamService.get_team_by_id(db, team_id, company_id)

        # Check if user is already a member
        existing = db.query(TeamMembership).filter(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == data.user_id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already a member of this team",
            )

        # Verify user has a membership in this company
        user_membership = db.query(Membership).filter(
            Membership.user_id == data.user_id,
            Membership.company_id == company_id,
        ).first()
        if not user_membership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a member of this company",
            )
        
        membership = TeamMembership(
            team_id=team_id,
            user_id=data.user_id,
            role=TeamMemberRole(data.role) if data.role else TeamMemberRole.MEMBER,
        )
        db.add(membership)
        try:
            db.commit()
            db.refresh(membership)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already a member of this team",
            )
        return membership

    @staticmethod
    def remove_member_from_team(
        db: Session, team_id: UUID, user_id: UUID, company_id: UUID
    ) -> None:
        """Remove a user from a team."""
        TeamService.get_team_by_id(db, team_id, company_id)

        membership = db.query(TeamMembership).filter(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == user_id,
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User is not a member of this team",
            )

        db.delete(membership)
        db.commit()
