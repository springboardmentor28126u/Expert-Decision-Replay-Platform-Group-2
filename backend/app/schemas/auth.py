# schemas/auth.py
"""
schemas/auth.py

Public self-registration schema — distinct from schemas/user.py's
UserCreate, which is the Administrator-only "create any user with any
role/team" schema (routers/users.py POST /users/).

RegisterRequest deliberately has NO role_id or team_id field: a
self-registering user must never be able to choose their own role.
The service layer assigns the default RoleName.EMPLOYEE role — an
elevation to Reviewer/Manager/Administrator only ever happens via the
existing Admin-only PATCH /users/{user_id}/role endpoint.
"""
from pydantic import EmailStr, Field, field_validator

from app.schemas.user import UserBase


class RegisterRequest(UserBase):
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not any(c.isdigit() for c in value):
            raise ValueError("Password must contain at least one digit.")
        if not any(c.isalpha() for c in value):
            raise ValueError("Password must contain at least one letter.")
        return value

