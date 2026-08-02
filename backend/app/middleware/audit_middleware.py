import logging
from typing import Callable, Optional

from fastapi import Request, Response

from app.auth.jwt_handler import verify_token
from app.database import SessionLocal
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)

IGNORED_PATHS = {
    "/",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/health",
}

IGNORED_PREFIXES = (
    "/static",
    "/docs",
    "/redoc",
    "/api/auth",
    "/api/decisions",
    "/api/users",
    "/api/alternatives",
    "/api/discussions",
    "/api/files",
    "/api/audit-logs",
)

AUDITABLE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def _extract_user_id(request: Request) -> Optional[int]:
    try:
        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
        token = auth_header.split(" ", 1)[1]
        payload = verify_token(token)
        if payload is None:
            return None
        user_id = payload.get("sub")
        return int(user_id) if user_id is not None else None
    except Exception:
        return None


def _get_client_ip(request: Request) -> Optional[str]:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


async def audit_middleware(request: Request, call_next: Callable) -> Response:
    response = await call_next(request)

    if request.method not in AUDITABLE_METHODS:
        return response

    path = request.url.path
    if path in IGNORED_PATHS:
        return response
    if path.startswith(IGNORED_PREFIXES):
        return response

    try:
        user_id = _extract_user_id(request)
        ip_address = _get_client_ip(request)
        action = f"{request.method} {path}"

        db = SessionLocal()
        try:
            audit_log = AuditLog(
                user_id=user_id,
                action=action,
                endpoint=path,
                http_method=request.method,
                response_status=response.status_code,
                ip_address=ip_address,
            )
            db.add(audit_log)
            db.commit()
        finally:
            db.close()
    except Exception as exc:
        logger.warning(f"Audit middleware logging failed: {exc}")

    return response
