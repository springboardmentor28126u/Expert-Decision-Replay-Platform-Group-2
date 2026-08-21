"""
Expert Decision Replay Platform - Teams Router

Endpoints for team management.
All team operations are scoped to the requesting user's company.
"""

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.session import get_db
from app.schemas.team import TeamResponse, TeamCreate, TeamUpdate, TeamMemberResponse, TeamMemberAdd
from app.schemas.common import MessageResponse
from app.services.team_service import TeamService
from app.api.deps import get_company_context, require_company_role, CompanyContext
from app.models.membership import CompanyRole
from app.core.limiter import limiter

router = APIRouter()


@router.get("", response_model=List[TeamResponse])
def list_teams(
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context),
):
    """List all teams in the current company."""
    return TeamService.get_teams(db, ctx.company_id)


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def create_team(
    request: Request,
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """Create a new team in the current company (company Admin only)."""
    return TeamService.create_team(db, team_data, ctx.company_id)


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context),
):
    """Get a specific team by ID within the current company."""
    return TeamService.get_team_by_id(db, team_id, ctx.company_id)


@router.put("/{team_id}", response_model=TeamResponse)
@limiter.limit("20/minute")
def update_team(
    request: Request,
    team_id: UUID,
    team_data: TeamUpdate,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """Update a team (company Admin only, must be in same company)."""
    return TeamService.update_team(db, team_id, team_data, ctx.company_id)


@router.delete("/{team_id}", response_model=MessageResponse)
@limiter.limit("5/minute")
def delete_team(
    request: Request,
    team_id: UUID,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """Delete a team (company Admin only, must be in same company)."""
    TeamService.delete_team(db, team_id, ctx.company_id)
    return {"message": f"Team {team_id} successfully deleted"}


# ─── Team Membership Endpoints ──────────────────────────────────────────

@router.get("/{team_id}/members", response_model=List[TeamMemberResponse])
def list_team_members(
    team_id: UUID,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(get_company_context),
):
    """List all members of a team."""
    return TeamService.list_team_members(db, team_id, ctx.company_id)


@router.post("/{team_id}/members", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def add_team_member(
    request: Request,
    team_id: UUID,
    data: TeamMemberAdd,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """Add a member to a team (company Admin only)."""
    membership = TeamService.add_member_to_team(db, team_id, data, ctx.company_id)
    from app.models.user import User
    user = db.query(User).filter(User.id == data.user_id).first()
    return TeamMemberResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=membership.role.value,
        joined_at=membership.joined_at,
    )


@router.delete("/{team_id}/members/{user_id}", response_model=MessageResponse)
@limiter.limit("10/minute")
def remove_team_member(
    request: Request,
    team_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    ctx: CompanyContext = Depends(require_company_role(CompanyRole.ADMIN)),
):
    """Remove a member from a team (company Admin only)."""
    TeamService.remove_member_from_team(db, team_id, user_id, ctx.company_id)
    return {"message": f"User {user_id} removed from team {team_id}"}
