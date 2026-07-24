"""
Expert Decision Replay Platform - API Dependencies

FastAPI dependencies for route injection.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.session import get_db
from app.core.security import decode_token
from app.services.user_service import UserService
from app.models.user import User, UserStatus, UserRole
from app.services.auth_service import redis_client

# Define the OAuth2 scheme (auto_error=False makes it optional)
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Dependency to get the currently authenticated user based on JWT token.
    Checks if token is blacklisted and if user is active.
    Also rejects tokens issued before a password reset.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Check if token is blacklisted in Redis
    if redis_client and redis_client.get(f"bl_{token}"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been blacklisted. Please log in again."
        )

    # Decode token
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception
        
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
        
    try:
        user_id = UUID(user_id_str)
    except ValueError:
         raise credentials_exception

    # Check if a password reset invalidated this token
    if redis_client:
        reset_ts = redis_client.get(f"pwd_reset_{user_id_str}")
        if reset_ts:
            token_iat = payload.get("iat")
            # If the token was issued before the password reset, reject it
            if token_iat and int(token_iat) < int(reset_ts):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Password was recently reset. Please log in again."
                )

    # Get user from DB
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
        
    return user


def get_optional_current_user(token: str | None = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)) -> User | None:
    """Dependency to optionally get the current user if a valid token is provided."""
    if not token:
        return None
    try:
        return get_current_user(token, db)
    except HTTPException:
        return None


def require_role(*allowed_roles: UserRole):
    """Dependency generator for global role-based access control."""
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role for this operation.",
            )
        return current_user
    return checker


from dataclasses import dataclass
from typing import Optional
from fastapi import Header, Query

from app.models.membership import Membership, CompanyRole
from app.models.group_membership import GroupMembership
from app.models.decision import Decision


@dataclass
class CompanyContext:
    """Encapsulates company tenant isolation context for a request."""
    company_id: UUID
    user: User
    role: CompanyRole
    membership: Membership


def get_company_context(
    x_company_id: Optional[UUID] = Header(None, alias="X-Company-ID"),
    company_id: Optional[UUID] = Query(None, alias="company_id"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompanyContext:
    """
    Dependency confirming current_user has a Membership in the requested company_id.
    Raises 403 HTTP Exception if not a member (tenant isolation check).
    """
    target_company_id = x_company_id or company_id
    if not target_company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company ID header (X-Company-ID) or query param (company_id) is required",
        )

    membership = (
        db.query(Membership)
        .filter(Membership.user_id == current_user.id, Membership.company_id == target_company_id)
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: User does not have membership in this company",
        )

    return CompanyContext(
        company_id=target_company_id,
        user=current_user,
        role=membership.role,
        membership=membership,
    )


def get_company_context_by_id(
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompanyContext:
    """Dependency confirming current_user has a Membership in path parameter company_id."""
    membership = (
        db.query(Membership)
        .filter(Membership.user_id == current_user.id, Membership.company_id == company_id)
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: User does not have membership in this company",
        )

    return CompanyContext(
        company_id=company_id,
        user=current_user,
        role=membership.role,
        membership=membership,
    )


def can_access_decision(user: User, decision: Decision, db: Session) -> bool:
    """
    Authorization helper / rule check:
    - Admin of decision.company_id -> full access
    - GroupMembership member of decision.group_id -> access allowed
    - Neither -> 403 Forbidden
    """
    membership = (
        db.query(Membership)
        .filter(Membership.user_id == user.id, Membership.company_id == decision.company_id)
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: User does not belong to the decision's company",
        )

    if membership.role == CompanyRole.ADMIN:
        return True

    group_membership = (
        db.query(GroupMembership)
        .filter(GroupMembership.user_id == user.id, GroupMembership.group_id == decision.group_id)
        .first()
    )
    if group_membership:
        return True

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Forbidden: User does not belong to the group associated with this decision",
    )


def require_company_role(*allowed_roles: CompanyRole):
    """Dependency generator for company-scoped Role-Based Access Control."""
    def checker(ctx: CompanyContext = Depends(get_company_context)) -> CompanyContext:
        if ctx.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient company role",
            )
        return ctx
    return checker

