from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from sqlalchemy.orm import Session

from app.config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

from app.database import get_db
from app.models import User

# -----------------------------------------
# Password Hashing Configuration
# -----------------------------------------
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# OAuth2 Scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# -----------------------------------------
# Hash Password
# -----------------------------------------
def hash_password(password: str):
    return pwd_context.hash(password)


# -----------------------------------------
# Verify Password
# -----------------------------------------
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# -----------------------------------------
# Create JWT Access Token
# -----------------------------------------
def create_access_token(data: dict):
    # Copy data
    to_encode = data.copy()

    # Token expiry time
    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # Add expiry into payload
    to_encode.update({"exp": expire})

    # Generate JWT
    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


# -----------------------------------------
# Get Current Logged-in User
# -----------------------------------------
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        },
    )

    try:
        # Decode JWT Token
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        # Read email from token
        email = payload.get("email")

        if email is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # Find user in database
    user = db.query(User).filter(
        User.email == email
    ).first()

    if user is None:
        raise credentials_exception

    return user

# -----------------------------------------
# Role Based Access Control
# -----------------------------------------
class RoleChecker:

    def __init__(self, allowed_roles):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)):

        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action."
            )

        return current_user