from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database.session import get_db
from app.schemas.user import UserCreate, UserOut, Token, UserLogin
from app.services.user import UserService
from app.core.security import create_access_token
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = UserService.get_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    # Restrict roles validation
    allowed_roles = {"employee", "reviewer", "manager", "administrator"}
    if user_in.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Allowed roles are: {list(allowed_roles)}"
        )
        
    new_user = UserService.create(db, user_in=user_in)
    from app.services.decision import AuditLogService
    AuditLogService.create(
        db,
        user_id=None,
        action="USER_REGISTER",
        entity_name="users",
        entity_id=str(new_user.id),
        new_values=f"Registered user: {new_user.email} as {new_user.role}"
    )
    return new_user


@router.post("/login", response_model=Token)
def login_user(login_in: UserLogin, db: Session = Depends(get_db)):
    user = UserService.authenticate(db, email=login_in.email, password=login_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is inactive"
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    from app.services.decision import AuditLogService
    AuditLogService.create(
        db,
        user_id=user.id,
        action="USER_LOGIN",
        entity_name="users",
        entity_id=str(user.id),
        new_values=f"Logged in user: {user.email}"
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login-form", response_model=Token)
def login_form_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = UserService.authenticate(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is inactive"
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    from app.services.decision import AuditLogService
    AuditLogService.create(
        db,
        user_id=user.id,
        action="USER_LOGIN_FORM",
        entity_name="users",
        entity_id=str(user.id),
        new_values=f"Logged in user: {user.email} via form"
    )
    return {"access_token": access_token, "token_type": "bearer"}

