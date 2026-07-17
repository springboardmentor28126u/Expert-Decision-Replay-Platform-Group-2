from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token
)
import traceback
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    RoleChecker
)

router = APIRouter()

# -----------------------------------------
# Register User
# -----------------------------------------
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        existing_user = db.query(User).filter(
            User.email == user.email
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        print("Password:", user.password)
        print("Type:", type(user.password))
        print("Length:", len(user.password))
        hashed_password = hash_password(user.password)

        new_user = User(
            full_name=user.full_name,
            email=user.email,
            password=hashed_password,
            role=user.role,
            department=user.department,
            team=user.team
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user

    except Exception as e:
        db.rollback()
        traceback.print_exc()   # Print the real error
        raise HTTPException(status_code=500,detail="Internal Server Error")

# -----------------------------------------
# Login
# -----------------------------------------
@router.post(
    "/login",
    response_model=Token
)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == login_data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        login_data.password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "id": user.id,
            "email": user.email,
            "role": user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# -----------------------------------------
# Current Logged-in User
# -----------------------------------------
@router.get(
    "/me",
    response_model=UserResponse
)
def read_current_user(
    current_user: User = Depends(get_current_user)
):

    return current_user


# -----------------------------------------
# Dashboard (Any Logged-in User)
# -----------------------------------------
@router.get("/dashboard")
def dashboard(
    current_user: User = Depends(get_current_user)
):
    return {
        "message": f"Welcome {current_user.full_name}",
        "role": current_user.role
    }


# -----------------------------------------
# Employee Dashboard
# -----------------------------------------
@router.get("/employee-dashboard")
def employee_dashboard(
    current_user: User = Depends(
        RoleChecker(["Employee"])
    )
):
    return {
        "message": "Welcome Employee",
        "user": current_user.full_name
    }


# -----------------------------------------
# Reviewer Dashboard
# -----------------------------------------
@router.get("/reviewer-dashboard")
def reviewer_dashboard(
    current_user: User = Depends(
        RoleChecker(["Reviewer"])
    )
):
    return {
        "message": "Welcome Reviewer",
        "user": current_user.full_name
    }


# -----------------------------------------
# Manager Dashboard
# -----------------------------------------
@router.get("/manager-dashboard")
def manager_dashboard(
    current_user: User = Depends(
        RoleChecker(["Manager"])
    )
):
    return {
        "message": "Welcome Manager",
        "user": current_user.full_name
    }


# -----------------------------------------
# Administrator Dashboard
# -----------------------------------------
@router.get("/admin-dashboard")
def admin_dashboard(
    current_user: User = Depends(
        RoleChecker(["Administrator"])
    )
):
    return {
        "message": "Welcome Administrator",
        "user": current_user.full_name
    }
