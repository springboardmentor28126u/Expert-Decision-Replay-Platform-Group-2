from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from app.models.user import User, Team
from app.schemas.user import UserCreate, UserUpdate, TeamCreate, TeamUpdate
from app.core.security import get_password_hash, verify_password

class UserService:
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_by_id(db: Session, user_id: UUID) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def create(db: Session, user_in: UserCreate) -> User:
        hashed_password = get_password_hash(user_in.password)
        db_user = User(
            email=user_in.email,
            hashed_password=hashed_password,
            full_name=user_in.full_name,
            role=user_in.role,
            team_id=user_in.team_id
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> Optional[User]:
        user = UserService.get_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def update(db: Session, db_user: User, user_in: UserUpdate) -> User:
        update_data = user_in.model_dump(exclude_unset=True)
        if "password" in update_data and update_data["password"]:
            hashed_password = get_password_hash(update_data["password"])
            db_user.hashed_password = hashed_password
            del update_data["password"]
            
        for field, value in update_data.items():
            setattr(db_user, field, value)
            
        db.commit()
        db.refresh(db_user)
        return db_user


class TeamService:
    @staticmethod
    def get_by_id(db: Session, team_id: UUID) -> Optional[Team]:
        return db.query(Team).filter(Team.id == team_id).first()

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Team]:
        return db.query(Team).filter(Team.name == name).first()

    @staticmethod
    def list(db: Session) -> List[Team]:
        return db.query(Team).all()

    @staticmethod
    def create(db: Session, team_in: TeamCreate) -> Team:
        db_team = Team(
            name=team_in.name,
            description=team_in.description
        )
        db.add(db_team)
        db.commit()
        db.refresh(db_team)
        return db_team

    @staticmethod
    def update(db: Session, db_team: Team, team_in: TeamUpdate) -> Team:
        update_data = team_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_team, field, value)
            
        db.commit()
        db.refresh(db_team)
        return db_team
