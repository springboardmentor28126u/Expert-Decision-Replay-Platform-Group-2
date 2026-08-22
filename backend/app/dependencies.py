from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

from app.database import get_db
from app import crud

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/users/login"
)

# =====================================================
# CURRENT USER
# =====================================================

def get_current_user(

    token: str = Depends(oauth2_scheme),

    db: Session = Depends(get_db)

):

    credentials_exception = HTTPException(

        status_code=status.HTTP_401_UNAUTHORIZED,

        detail="Invalid or expired token"

    )

    try:

        payload = jwt.decode(

            token,

            SECRET_KEY,

            algorithms=[ALGORITHM]

        )

        email = payload.get("sub")

        if email is None:

            raise credentials_exception

    except JWTError:

        raise credentials_exception

    user = crud.get_user_by_email(

        db,

        email

    )

    if user is None:

        raise credentials_exception

    if not user.is_active:

        raise HTTPException(

            status_code=403,

            detail="Your account has been deactivated."

        )

    return user


# =====================================================
# ROLE CHECK
# =====================================================

def require_roles(*allowed_roles):

    def role_checker(

        current_user=Depends(get_current_user)

    ):

        if current_user.role not in allowed_roles:

            raise HTTPException(

                status_code=403,

                detail="Access denied."

            )

        return current_user

    return role_checker


# =====================================================
# EMPLOYEE
# =====================================================

require_employee = require_roles(

    "Employee",

    "Reviewer",

    "Manager",

    "Administrator"

)

# =====================================================
# REVIEWER
# =====================================================

require_reviewer = require_roles(

    "Reviewer",

    "Manager",

    "Administrator"

)
# =====================================================
# ALTERNATIVE CREATOR
# =====================================================

require_alternative_creator = require_roles(
    "Employee",
    "Manager",
    "Administrator"
)
# =====================================================
# MANAGER
# =====================================================

require_manager = require_roles(

    "Manager",

    "Administrator"

)

# =====================================================
# ADMIN
# =====================================================

require_admin = require_roles(

    "Administrator"

)