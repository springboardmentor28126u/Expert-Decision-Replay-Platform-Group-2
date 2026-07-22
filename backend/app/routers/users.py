from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.session import get_db
from app.models.user import User, Team
from app.schemas.user import UserOut, UserUpdate, TeamOut, TeamCreate, TeamUpdate, UserOutWithTeam
from app.services.user import UserService, TeamService
from app.routers.deps import get_current_active_user, RoleChecker

router = APIRouter(prefix="/users", tags=["users"])

# Profile endpoints
@router.get("/me", response_model=UserOutWithTeam)
def read_current_user(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.put("/me", response_model=UserOut)
def update_current_user(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Prevent normal users from upgrading their own role
    if user_in.role and user_in.role != current_user.role:
        if current_user.role != "administrator":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can update user roles."
            )
            
    # Check email duplicate if they are changing email
    if user_in.email and user_in.email != current_user.email:
        existing = UserService.get_by_email(db, email=user_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use."
            )
            
    return UserService.update(db, db_user=current_user, user_in=user_in)

@router.get("/reviewers/list", response_model=List[UserOut])
def list_potential_reviewers(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(User).filter(User.role.in_(["reviewer", "manager", "administrator"])).all()

# Admin endpoints for user listing
@router.get("/all", response_model=List[UserOut], dependencies=[Depends(RoleChecker(["administrator"]))])

def list_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# Admin / Manager endpoints for looking up details of a user
@router.get("/{user_id}", response_model=UserOut, dependencies=[Depends(RoleChecker(["administrator", "manager"]))])
def read_user_by_id(user_id: UUID, db: Session = Depends(get_db)):
    user = UserService.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

# Team endpoints
@router.get("/teams", response_model=List[TeamOut])
def list_teams(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return TeamService.list(db)

@router.post("/teams", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
def create_team(
    team_in: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["administrator"]))
):
    existing = TeamService.get_by_name(db, name=team_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team with this name already exists."
        )
    return TeamService.create(db, team_in=team_in)

@router.put("/teams/{team_id}/assign-manager", response_model=TeamOut)
def assign_team_manager(
    team_id: UUID,
    manager_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["administrator"]))
):
    team = TeamService.get_by_id(db, team_id=team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
        
    manager = UserService.get_by_id(db, user_id=manager_id)
    if not manager:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposed manager user not found"
        )
        
    if manager.role != "manager" and manager.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The proposed user must have the manager or administrator role."
        )
        
    team_update = TeamUpdate(manager_id=manager_id)
    return TeamService.update(db, db_team=team, team_in=team_update)

@router.post("/teams/{team_id}/join", response_model=UserOut)
def join_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    team = TeamService.get_by_id(db, team_id=team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
        
    user_update = UserUpdate(team_id=team_id)
    return UserService.update(db, db_user=current_user, user_in=user_update)
