"""
app/db/init_db.py

Seeds the four fixed roles (RoleName enum). Must run once, after
`alembic upgrade head`, before anyone can hit POST /auth/register —
AuthService.register() looks up the "employee" role by name and fails
if it doesn't exist yet.

Run with:  python -m app.db.init_db
"""
import asyncio

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.enums import RoleName
from app.models.role import Role

DEFAULT_ROLES = [
    (RoleName.EMPLOYEE.value, "Standard employee — creates and views decisions."),
    (RoleName.REVIEWER.value, "Reviews and approves/rejects assigned decisions."),
    (RoleName.MANAGER.value, "Manages a team; approves decisions; views team reports."),
    (RoleName.ADMINISTRATOR.value, "Full system access — user, role, and team management."),
]


async def seed_roles() -> None:
    async with AsyncSessionLocal() as session:
        for name, description in DEFAULT_ROLES:
            result = await session.execute(select(Role).where(Role.name == name))
            existing = result.scalar_one_or_none()
            if existing is None:
                session.add(Role(name=name, description=description))
                print(f"Created role: {name}")
            else:
                print(f"Role already exists, skipping: {name}")
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed_roles())

