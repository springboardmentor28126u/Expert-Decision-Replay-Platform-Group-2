from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.team import Team
from app.models.user import User
from app.schemas.team import TeamCreate, TeamOut, AssignTeam
from app.auth.dependencies import require_role

router = APIRouter(prefix="/teams", tags=["Team Management"])


@router.post("/", response_model=TeamOut)
def create_team(team: TeamCreate, admin=Depends(require_role("administrator", "manager")), db: Session = Depends(get_db)):
    existing = db.query(Team).filter(Team.name == team.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Team already exists")

    new_team = Team(name=team.name, manager_id=team.manager_id)
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    return new_team


@router.get("/", response_model=List[TeamOut])
def list_teams(db: Session = Depends(get_db)):
    return db.query(Team).all()


@router.put("/assign/{user_id}")
def assign_user_to_team(user_id: int, assignment: AssignTeam, admin=Depends(require_role("administrator", "manager")), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    team = db.query(Team).filter(Team.id == assignment.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    user.team_id = assignment.team_id
    db.commit()
    db.refresh(user)
    return {"message": f"{user.full_name} assigned to team {team.name}"}