from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.database import get_db
from app.models.user import User

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        email = payload.get("sub")

        if email is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise credentials_exception

    return user


# ===========================
# Role Based Access Control
# ===========================

def require_employee(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["Employee", "Reviewer", "Manager", "Administrator"]:
        raise HTTPException(
            status_code=403,
            detail="Employee access required"
        )
    return current_user


def require_reviewer(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["Reviewer", "Manager", "Administrator"]:
        raise HTTPException(
            status_code=403,
            detail="Reviewer access required"
        )
    return current_user


def require_manager(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["Manager", "Administrator"]:
        raise HTTPException(
            status_code=403,
            detail="Manager access required"
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "Administrator":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required"
        )
    return current_user