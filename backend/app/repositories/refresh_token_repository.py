# repositories/refresh_token_repository.py
"""
repositories/refresh_token_repository.py

Refresh tokens are looked up by hash (on /auth/refresh) or revoked by
jti (on /auth/logout, or "log out everywhere"). Never queried or
returned by the raw token itself — only the hash is stored.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self, user_id: uuid.UUID, token_hash: str, jti: str, expires_at: datetime
    ) -> RefreshToken:
        record = RefreshToken(
            user_id=user_id, token_hash=token_hash, jti=jti, expires_at=expires_at, revoked=False
        )
        self.db.add(record)
        await self.db.flush()
        return record

    async def get_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def is_valid(self, record: RefreshToken) -> bool:
        return not record.revoked and record.expires_at > datetime.now(timezone.utc)

    async def revoke_by_hash(self, token_hash: str) -> None:
        await self.db.execute(
            update(RefreshToken).where(RefreshToken.token_hash == token_hash).values(revoked=True)
        )
        await self.db.flush()

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        """Used for a future "log out everywhere" action; not wired to a route yet in Milestone 1."""
        await self.db.execute(
            update(RefreshToken).where(RefreshToken.user_id == user_id).values(revoked=True)
        )
        await self.db.flush()

