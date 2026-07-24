# utils/exceptions.py
"""
utils/exceptions.py

Custom domain exceptions. Services/routers raise these instead of
returning ad-hoc error dicts or raising bare HTTPException — main.py's
global `app_exception_handler` catches AppException (and subclasses)
and renders them as a consistent {"error": ..., "detail": ...} JSON
shape (see main.py, "Global exception handlers").
"""
from fastapi import status


class AppException(Exception):
    """Base class for every custom domain exception in this app."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    error_code: str = "app_error"

    def __init__(self, detail: str, error_code: str | None = None, status_code: int | None = None) -> None:
        self.detail = detail
        if error_code is not None:
            self.error_code = error_code
        if status_code is not None:
            self.status_code = status_code
        super().__init__(detail)


class NotFoundException(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "not_found"

    def __init__(self, detail: str = "Resource not found.") -> None:
        super().__init__(detail)


class PermissionDeniedException(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "permission_denied"

    def __init__(self, detail: str = "You do not have permission to perform this action.") -> None:
        super().__init__(detail)


class UnauthorizedException(AppException):
    """
    Distinct from PermissionDeniedException: this means "we don't know
    who you are" (missing/invalid/expired credentials), whereas
    PermissionDeniedException means "we know who you are, and the
    answer is no."
    """
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "unauthorized"

    def __init__(self, detail: str = "Could not validate credentials.") -> None:
        super().__init__(detail)


class ConflictException(AppException):
    """e.g. duplicate email on user creation, unique-constraint violations."""
    status_code = status.HTTP_409_CONFLICT
    error_code = "conflict"

    def __init__(self, detail: str = "Resource conflict.") -> None:
        super().__init__(detail)


class ValidationException(AppException):
    """
    For business-rule validation failures that aren't a Pydantic schema
    error (those are caught separately by main.py's
    RequestValidationError handler) — e.g. "role does not exist",
    "cannot approve your own decision".
    """
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "validation_error"

    def __init__(self, detail: str = "Validation failed.") -> None:
        super().__init__(detail)

