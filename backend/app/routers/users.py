from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, schemas
from app.security import create_access_token
from app.dependencies import (
    get_current_user,
    require_manager,
    require_admin
)

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# =====================================================
# REGISTER
# =====================================================

@router.post(
    "/register",
    response_model=schemas.UserResponse
)
def register(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):

    # Only Employee and Reviewer can self-register
    if user.role not in ["Employee", "Reviewer"]:

        raise HTTPException(
            status_code=403,
            detail="Only Employee and Reviewer accounts can be registered."
        )

    new_user = crud.create_user(db, user)

    if new_user is None:

        raise HTTPException(
            status_code=400,
            detail="Employee ID or Email already exists."
        )

    return new_user
@router.post("/create-first-admin")
def create_first_admin(db: Session = Depends(get_db)):

    admin = schemas.AdminUserCreate(
        employee_id="ADM001",
        full_name="System Administrator",
        email="admin@edrp.com",
        password="Admin@123",
        role="Administrator",
        department="Administration",
        security_question="What is your favorite color?",
        security_answer="Blue",
        is_active=True
    )

    user = crud.admin_create_user(db, admin)

    if user is None:
        return {"message": "Administrator already exists"}

    return {
        "message": "Administrator created successfully",
        "employee_id": "ADM001",
        "password": "Admin@123"
    }
# =====================================================
# ADMIN CREATE USER
# =====================================================

@router.post(
    "/admin/create",
    response_model=schemas.UserResponse
)
def admin_create_user(

    user: schemas.AdminUserCreate,

    db: Session = Depends(get_db),

    current_user=Depends(require_admin)

):

    new_user = crud.admin_create_user(

        db,

        user

    )

    if new_user is None:

        raise HTTPException(

            status_code=400,

            detail="Employee ID or Email already exists."
        )

    return new_user

# =====================================================
# LOGIN
# =====================================================

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    db_user = crud.authenticate_user(
        db,
        form_data.username,
        form_data.password
    )

    if not db_user:

        raise HTTPException(
            status_code=401,
            detail="Invalid Employee ID or Password"
        )

    # Prevent inactive users from logging in
    if not db_user.is_active:

        raise HTTPException(
            status_code=403,
            detail="Your account has been deactivated."
        )

    token = create_access_token(
        {"sub": db_user.email}
    )

    return {

        "access_token": token,

        "token_type": "bearer"

    }


# =====================================================
# CURRENT USER
# =====================================================

@router.get(
    "/me",
    response_model=schemas.UserResponse
)
def get_current_user_details(

    current_user=Depends(get_current_user)

):

    return current_user

# =====================================================
# PROFILE
# =====================================================

@router.get(
    "/profile",
    response_model=schemas.UserResponse
)
def get_profile(

    current_user=Depends(get_current_user)

):

    return current_user


# =====================================================
# UPDATE PROFILE
# =====================================================

@router.put(
    "/profile",
    response_model=schemas.UserResponse
)
def update_profile(

    profile: schemas.ProfileUpdate,

    db: Session = Depends(get_db),

    current_user=Depends(get_current_user)

):

    # Employees & Reviewers cannot change department

    if current_user.role in ["Employee", "Reviewer"]:

        profile.department = current_user.department

    updated_user = crud.update_profile(

        db,

        current_user.id,

        profile

    )

    if updated_user is None:

        raise HTTPException(

            status_code=404,

            detail="User not found"

        )

    return updated_user


# =====================================================
# CHANGE PASSWORD
# =====================================================

@router.put("/change-password")
def change_password(

    password_data: schemas.ChangePassword,

    db: Session = Depends(get_db),

    current_user=Depends(get_current_user)

):

    success = crud.change_password(

        db,

        current_user.id,

        password_data

    )

    if not success:

        raise HTTPException(

            status_code=400,

            detail="Current password is incorrect."

        )

    return {

        "message": "Password updated successfully."

    }

# =====================================================
# FORGOT PASSWORD
# =====================================================

@router.post("/forgot-password")
def forgot_password(

    data: schemas.ForgotPassword,

    db: Session = Depends(get_db)

):

    verified = crud.verify_forgot_password(

        db,

        data

    )

    if not verified:

        raise HTTPException(

            status_code=400,

            detail="Invalid Employee ID, Email, Security Question, or Security Answer."

        )

    return {

        "message": "Identity verified successfully."

    }

# =====================================================
# RESET PASSWORD
# =====================================================
@router.put("/reset-password")
def reset_password(

    data: schemas.ResetPassword,

    db: Session = Depends(get_db)

):

    success = crud.reset_password(

        db,

        data.employee_id,

        data.email,

        data.new_password

    )

    if not success:

        raise HTTPException(

            status_code=404,

            detail="User not found."

        )

    return {

        "message": "Password reset successfully."

    }


# =====================================================
# GET ALL USERS
# Manager & Administrator
# =====================================================

@router.get(
    "/all",
    response_model=list[schemas.UserResponse]
)
def get_all_users(

    db: Session = Depends(get_db),

    current_user=Depends(require_manager)

):

    return crud.get_all_users(db)


# =====================================================
# GET USER BY ID
# Manager & Administrator
# =====================================================

@router.get(
    "/details/{user_id}",
    response_model=schemas.UserResponse
)
def get_user(

    user_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_manager)

):

    user = crud.get_user_by_id(
        db,
        user_id
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# =====================================================
# UPDATE USER
# Administrator Only
# =====================================================

@router.put(
    "/{user_id}",
    response_model=schemas.UserResponse
)
def update_user(

    user_id: int,

    user: schemas.UserUpdate,

    db: Session = Depends(get_db),

    current_user=Depends(require_admin)

):

    updated = crud.update_user(
        db,
        user_id,
        user
    )

    if not updated:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return updated


# =====================================================
# DELETE USER
# Administrator Only
# =====================================================

@router.delete("/{user_id}")
def delete_user(

    user_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_admin)

):

    deleted = crud.delete_user(
        db,
        user_id
    )

    if not deleted:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {

        "message": "User deleted successfully"

    }


# =====================================================
# ACTIVATE / DEACTIVATE USER
# Administrator Only
# =====================================================

@router.patch(
    "/status/{user_id}",
    response_model=schemas.UserResponse
)
def change_user_status(

    user_id: int,

    user: schemas.UserUpdate,

    db: Session = Depends(get_db),

    current_user=Depends(require_admin)

):

    updated = crud.update_user(
        db,
        user_id,
        user
    )

    if not updated:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return updated