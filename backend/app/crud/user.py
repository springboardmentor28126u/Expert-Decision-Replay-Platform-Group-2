from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.security import (
    hash_password,
    verify_password
)


# ----------------------------------------
# Get User By Email
# ----------------------------------------
def get_user_by_email(db: Session, email: str):

    return db.query(User).filter(
        User.email == email
    ).first()


# ----------------------------------------
# Create New User
# ----------------------------------------
def create_user(db: Session, user: UserCreate):

    hashed_pwd = hash_password(user.password)

    db_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hashed_pwd,
        role=user.role
    )

    db.add(db_user)

    db.commit()

    db.refresh(db_user)

    return db_user


# ----------------------------------------
# Authenticate User
# ----------------------------------------
def authenticate_user(
    db: Session,
    email: str,
    password: str
):

    user = get_user_by_email(db, email)

    if not user:
        return None

    if not verify_password(
        password,
        user.password
    ):
        return None

    return user


# ----------------------------------------
# Get User By ID
# ----------------------------------------
def get_user_by_id(
    db: Session,
    user_id: int
):

    return db.query(User).filter(
        User.id == user_id
    ).first()